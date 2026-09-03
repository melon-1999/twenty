import { Injectable } from '@nestjs/common';

import { FieldActorSource } from 'twenty-shared/types';
import { v4 } from 'uuid';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type WebForm } from 'src/modules/opportunity/types/web-form-key-value.type';
import {
  buildWebFormPersonInsert,
  type WebFormSubmissionInput,
} from 'src/modules/opportunity/utils/build-web-form-person-insert.util';
import { resolveWebFormDealName } from 'src/modules/opportunity/utils/resolve-web-form-deal-name.util';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

@Injectable()
export class WebFormSubmissionService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async submit({
    workspaceId,
    form,
    input,
  }: {
    workspaceId: string;
    form: WebForm;
    input: WebFormSubmissionInput;
  }): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const personRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          PersonWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );
      const opportunityRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          OpportunityWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );

      const createdBy = {
        source: FieldActorSource.WEBHOOK,
        workspaceMemberId: null,
        name: 'Web Form',
        context: {},
      };

      const personId = v4();
      const lastPersonPosition =
        (await personRepository.maximum('position', undefined)) ?? 0;

      await personRepository.insert({
        id: personId,
        ...buildWebFormPersonInsert(input),
        position: lastPersonPosition + 1,
        createdBy,
      });

      const lastOpportunityPosition =
        (await opportunityRepository.maximum('position', undefined)) ?? 0;

      await opportunityRepository.insert({
        id: v4(),
        name: resolveWebFormDealName(form.dealNameTemplate, {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
        }),
        stage: form.stage,
        pointOfContactId: personId,
        position: lastOpportunityPosition + 1,
        createdBy,
      });
    }, authContext);
  }
}
