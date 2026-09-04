import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardProductViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'product'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    // allProducts view fields
    allProductsName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'allProducts',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 180,
      },
    }),
    allProductsPrice: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'allProducts',
        viewFieldName: 'price',
        fieldName: 'price',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allProductsCode: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'allProducts',
        viewFieldName: 'code',
        fieldName: 'code',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allProductsDescription: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'allProducts',
        viewFieldName: 'description',
        fieldName: 'description',
        position: 3,
        isVisible: true,
        size: 200,
      },
    }),
    allProductsIsActive: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'allProducts',
        viewFieldName: 'isActive',
        fieldName: 'isActive',
        position: 4,
        isVisible: true,
        size: 100,
      },
    }),
    allProductsCreatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'allProducts',
        viewFieldName: 'createdBy',
        fieldName: 'createdBy',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
    allProductsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'allProducts',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 6,
        isVisible: true,
        size: 150,
      },
    }),

    // productRecordPageFields view fields
    productRecordPageFieldsPrice: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'productRecordPageFields',
        viewFieldName: 'price',
        fieldName: 'price',
        position: 0,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    productRecordPageFieldsCode: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'productRecordPageFields',
        viewFieldName: 'code',
        fieldName: 'code',
        position: 1,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    productRecordPageFieldsDescription: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'productRecordPageFields',
        viewFieldName: 'description',
        fieldName: 'description',
        position: 2,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    productRecordPageFieldsIsActive: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'productRecordPageFields',
        viewFieldName: 'isActive',
        fieldName: 'isActive',
        position: 3,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    // System group
    productRecordPageFieldsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'productRecordPageFields',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 0,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'system',
      },
    }),
    productRecordPageFieldsCreatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'product',
      context: {
        viewName: 'productRecordPageFields',
        viewFieldName: 'createdBy',
        fieldName: 'createdBy',
        position: 1,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'system',
      },
    }),
  };
};
