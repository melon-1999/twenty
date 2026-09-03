import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { ILike } from 'typeorm';
import { v4 } from 'uuid';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type WebForm } from 'src/modules/opportunity/types/web-form-key-value.type';
import { buildWebFormNoteBody } from 'src/modules/opportunity/utils/build-web-form-note-body.util';
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
    company,
    message,
  }: {
    workspaceId: string;
    form: WebForm;
    input: WebFormSubmissionInput;
    company: string;
    message: string;
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
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          CompanyWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );
      const noteRepository = await this.globalWorkspaceOrmManager.getRepository(
        workspaceId,
        NoteWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const noteTargetRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          NoteTargetWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );

      const createdBy = {
        source: FieldActorSource.WEBHOOK,
        workspaceMemberId: null,
        name: 'Web Form',
        context: {},
      };

      let companyId: string | undefined;

      if (isNonEmptyString(company)) {
        const existingCompany = await companyRepository.findOne({
          where: { name: ILike(company) },
          order: { createdAt: 'ASC' },
        });

        if (isDefined(existingCompany)) {
          companyId = existingCompany.id;
        } else {
          companyId = v4();
          const lastCompanyPosition =
            (await companyRepository.maximum('position', undefined)) ?? 0;

          await companyRepository.insert({
            id: companyId,
            name: company,
            position: lastCompanyPosition + 1,
            createdBy,
          });
        }
      }

      const existingPerson = await personRepository.findOne({
        where: { emails: { primaryEmail: input.email.toLowerCase() } },
      });

      let personId: string;

      if (isDefined(existingPerson)) {
        personId = existingPerson.id;
      } else {
        personId = v4();
        const lastPersonPosition =
          (await personRepository.maximum('position', undefined)) ?? 0;

        await personRepository.insert({
          id: personId,
          ...buildWebFormPersonInsert(input),
          ...(isDefined(companyId) ? { companyId } : {}),
          position: lastPersonPosition + 1,
          createdBy,
        });
      }

      const lastOpportunityPosition =
        (await opportunityRepository.maximum('position', undefined)) ?? 0;
      const opportunityId = v4();

      await opportunityRepository.insert({
        id: opportunityId,
        name: resolveWebFormDealName(form.dealNameTemplate, {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
        }),
        stage: form.stage,
        pointOfContactId: personId,
        ...(isDefined(companyId) ? { companyId } : {}),
        position: lastOpportunityPosition + 1,
        createdBy,
      });

      if (isNonEmptyString(message)) {
        const noteId = v4();
        const lastNotePosition =
          (await noteRepository.maximum('position', undefined)) ?? 0;
        const senderName = `${input.firstName} ${input.lastName}`.trim();
        const title = isNonEmptyString(senderName)
          ? `Nachricht von ${senderName}`
          : 'Web-Formular Nachricht';

        await noteRepository.insert({
          id: noteId,
          title,
          bodyV2: buildWebFormNoteBody(message),
          position: lastNotePosition + 1,
          createdBy,
        });

        await noteTargetRepository.insert([
          { id: v4(), noteId, targetOpportunityId: opportunityId },
          { id: v4(), noteId, targetPersonId: personId },
        ]);
      }
    }, authContext);
  }
}
