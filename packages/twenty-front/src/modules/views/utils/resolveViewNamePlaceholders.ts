import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

import { type FlatObjectMetadataItem } from '@/metadata-store/types/FlatObjectMetadataItem';

export const resolveViewNamePlaceholders = (
  viewName: string | undefined,
  objectMetadataItem: FlatObjectMetadataItem | undefined,
): string => {
  if (!isDefined(viewName) || !isDefined(objectMetadataItem)) {
    return viewName ?? '';
  }

  const objectLabelPlural = objectMetadataItem.labelPlural;
  const objectLabelSingular = objectMetadataItem.labelSingular;

  // Default system view names are English and never extracted for i18n. The
  // server ships them already placeholder-substituted (e.g. "All Unternehmen"),
  // so match both the raw template and the substituted form. User-renamed views
  // fall through and only get any remaining placeholders substituted.
  switch (viewName) {
    case 'All {objectLabelPlural}':
    case `All ${objectLabelPlural}`:
      return t`All ${objectLabelPlural}`;
    case 'By Stage':
      return t`By Stage`;
    case 'By Status':
      return t`By Status`;
    case 'Assigned to Me':
      return t`Assigned to Me`;
    default:
      return viewName
        .replace('{objectLabelPlural}', objectLabelPlural)
        .replace('{objectLabelSingular}', objectLabelSingular);
  }
};
