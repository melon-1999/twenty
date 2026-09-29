// oxlint-disable twenty/graphql-resolvers-should-be-guarded
import { type INestApplication, Module } from '@nestjs/common';
import { type ModuleRef } from '@nestjs/core';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';

import { YogaDriver, type YogaDriverConfig } from '@graphql-yoga/nestjs';
import request from 'supertest';

import { type DirectExecutionService } from 'src/engine/api/graphql/direct-execution/direct-execution.service';
import { GraphQLConfigService } from 'src/engine/api/graphql/graphql-config/graphql-config.service';
import { adminPanelModuleFactory } from 'src/engine/api/graphql/admin-panel.module-factory';
import { metadataModuleFactory } from 'src/engine/api/graphql/metadata.module-factory';
import { type CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { type ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { type FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { type I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { type MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { applyCredentialedCors } from 'src/engine/core-modules/user-session/utils/apply-credentialed-cors.util';
import { type DataloaderService } from 'src/engine/dataloaders/dataloader.service';
import { type WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

// Only the CORS options of the Yoga configs are under test; the schema
// modules would pull the whole engine into the test.
jest.mock('src/engine/core-modules/core-engine.module', () => ({
  CoreEngineModule: class {},
}));
jest.mock('src/engine/api/graphql/metadata-graphql-api.module', () => ({
  MetadataGraphQLApiModule: class {},
}));
jest.mock('src/engine/api/graphql/admin-panel-graphql-api.module', () => ({
  AdminPanelGraphQLApiModule: class {},
}));

const PRODUCTION_SERVER_URL = 'https://crm.example.com';
const DEVELOPMENT_FRONTEND_URL = 'http://localhost:3001';
const FOREIGN_ORIGIN = 'https://evil.example.com';

const PING_QUERY = '{ ping }';

@Resolver()
class PingResolver {
  @Query(() => String)
  ping(): string {
    return 'pong';
  }
}

let mockConfig: Record<string, unknown> = {};

const twentyConfigService = {
  get: jest.fn((key: string) => mockConfig[key]),
} as unknown as TwentyConfigService;

const dataloaderService = {
  createLoaders: jest.fn(() => ({})),
} as unknown as DataloaderService;

const buildCoreYogaConfig = async (): Promise<YogaDriverConfig> =>
  new GraphQLConfigService(
    {} as ExceptionHandlerService,
    twentyConfigService,
    {} as ModuleRef,
    {} as MetricsService,
    dataloaderService,
    {} as I18nService,
    {} as DirectExecutionService,
    {} as FeatureFlagService,
  ).createGqlOptions();

const buildMetadataYogaConfig = (): Promise<YogaDriverConfig> =>
  metadataModuleFactory(
    twentyConfigService,
    {} as ExceptionHandlerService,
    dataloaderService,
    { get: jest.fn(), set: jest.fn() } as unknown as CacheStorageService,
    {} as MetricsService,
    {} as I18nService,
    {} as FeatureFlagService,
    {
      getOrRecomputeCombinedHash: jest.fn(),
    } as unknown as WorkspaceCacheService,
  );

const buildAdminPanelYogaConfig = (): Promise<YogaDriverConfig> =>
  adminPanelModuleFactory(
    twentyConfigService,
    {} as ExceptionHandlerService,
    dataloaderService,
    {} as MetricsService,
    {} as I18nService,
  );

// Serves a ping schema with the CORS-relevant options of the real Yoga
// config, behind the production CORS middleware, so the response headers are
// the ones a browser would see on that endpoint.
const createApp = async (
  buildYogaConfig: () => Promise<YogaDriverConfig>,
): Promise<{ app: INestApplication; path: string }> => {
  const { cors, path } = await buildYogaConfig();

  @Module({
    imports: [
      GraphQLModule.forRoot<YogaDriverConfig>({
        driver: YogaDriver,
        autoSchemaFile: true,
        path,
        cors,
      }),
    ],
    providers: [PingResolver],
  })
  class CorsTestModule {}

  const moduleRef = await Test.createTestingModule({
    imports: [CorsTestModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  applyCredentialedCors(app, twentyConfigService);

  await app.init();

  return { app, path: path ?? '/graphql' };
};

describe.each([
  ['core', buildCoreYogaConfig],
  ['metadata', buildMetadataYogaConfig],
  ['admin panel', buildAdminPanelYogaConfig],
])('%s GraphQL endpoint CORS', (_endpointName, buildYogaConfig) => {
  let app: INestApplication;
  let path: string;

  afterEach(async () => {
    await app.close();
  });

  describe('in production', () => {
    beforeEach(async () => {
      mockConfig = {
        NODE_ENV: 'production',
        SERVER_URL: PRODUCTION_SERVER_URL,
        FRONTEND_URL: undefined,
        AUTH_COOKIE_ALLOWED_ORIGINS: '',
      };
      ({ app, path } = await createApp(buildYogaConfig));
    });

    it.each(['GET', 'POST'])(
      'should not grant a foreign origin credentialed access on %s',
      async (method) => {
        const response =
          method === 'GET'
            ? await request(app.getHttpServer())
                .get(path)
                .query({ query: PING_QUERY })
                .set('Origin', FOREIGN_ORIGIN)
                .set('Accept', 'application/json')
            : await request(app.getHttpServer())
                .post(path)
                .send({ query: PING_QUERY })
                .set('Origin', FOREIGN_ORIGIN);

        expect(response.headers['access-control-allow-origin']).not.toBe(
          FOREIGN_ORIGIN,
        );
        expect(response.headers['access-control-allow-origin']).toBe('*');
      },
    );

    it('should grant the server origin credentialed access for same-origin requests', async () => {
      const response = await request(app.getHttpServer())
        .post(path)
        .send({ query: PING_QUERY })
        .set('Origin', PRODUCTION_SERVER_URL);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ ping: 'pong' });
      expect(response.headers['access-control-allow-origin']).toBe(
        PRODUCTION_SERVER_URL,
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should serve requests without an Origin header', async () => {
      const response = await request(app.getHttpServer())
        .post(path)
        .send({ query: PING_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ ping: 'pong' });
    });
  });

  describe('in development with a separate front-end origin', () => {
    beforeEach(async () => {
      mockConfig = {
        NODE_ENV: 'development',
        SERVER_URL: 'http://localhost:3000',
        FRONTEND_URL: DEVELOPMENT_FRONTEND_URL,
        AUTH_COOKIE_ALLOWED_ORIGINS: '',
      };
      ({ app, path } = await createApp(buildYogaConfig));
    });

    it('should answer the preflight for the front-end origin with credentials', async () => {
      const response = await request(app.getHttpServer())
        .options(path)
        .set('Origin', DEVELOPMENT_FRONTEND_URL)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      expect(response.status).toBeLessThan(300);
      expect(response.headers['access-control-allow-origin']).toBe(
        DEVELOPMENT_FRONTEND_URL,
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should grant the front-end origin credentialed access', async () => {
      const response = await request(app.getHttpServer())
        .post(path)
        .send({ query: PING_QUERY })
        .set('Origin', DEVELOPMENT_FRONTEND_URL);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ ping: 'pong' });
      expect(response.headers['access-control-allow-origin']).toBe(
        DEVELOPMENT_FRONTEND_URL,
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers.vary).toContain('Origin');
    });

    it('should not grant a foreign origin credentialed access', async () => {
      const response = await request(app.getHttpServer())
        .post(path)
        .send({ query: PING_QUERY })
        .set('Origin', FOREIGN_ORIGIN);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });
});
