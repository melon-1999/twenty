import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.30.0', 1786301209072)
export class CreateWorkspaceCapabilityCoreTableFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."workspaceCapability" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" text NOT NULL,
        "value" boolean NOT NULL,
        "workspaceId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_45e98eff7a5f12600e89ca634f9" PRIMARY KEY ("id"),
        CONSTRAINT "IDX_WORKSPACE_CAPABILITY_KEY_WORKSPACE_ID_UNIQUE" UNIQUE ("key", "workspaceId"),
        CONSTRAINT "FK_b7be4d98cb909edf3ce90be4306" FOREIGN KEY ("workspaceId")
          REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "core"."workspaceCapability"`,
    );
  }
}
