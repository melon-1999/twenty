import { t } from '@lingui/core/macro';
import { PRODUCT_BRANDING } from 'twenty-shared/constants';

export const getStandardApplicationDescription =
  (): string => t`The base data model every ${PRODUCT_BRANDING.name} workspace runs on.

#### What "foundation" means

Every ${PRODUCT_BRANDING.name} workspace starts with this set of objects. They define the shape of your CRM, including relationships, activity, and reporting. Everything else, including marketplace apps, AI agents, and custom objects, plugs into them.

#### Included objects
- **People & Companies**: contact and account records
- **Opportunities**: your sales pipeline
- **Notes & Tasks**: activity and follow-ups
- **Workflows & Dashboards**: automation and reporting

Remove this app and the rest of ${PRODUCT_BRANDING.name} has nothing to hang off.`;
