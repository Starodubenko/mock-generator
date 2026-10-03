import { asPlainString } from '../json/as-plain-string';
import type { FieldConstraint } from './field-constraint';
import type { ConstraintField } from './constraint-fields-from-profile';

const asValues = (raw: unknown): string[] => {
  if (raw === undefined || raw === null || raw === '') {
    return [];
  }
  const items = Array.isArray(raw) ? raw : asPlainString(raw).split(',');
  return items
    .map((item) => asPlainString(item).trim())
    .filter((item) => item.length > 0);
};

export const parseConstraintForm = (
  body: Record<string, unknown>,
  fields: ConstraintField[],
): FieldConstraint[] => {
  const result: FieldConstraint[] = [];
  for (const field of fields) {
    const values = asValues(body[`constraint.${field.path}`]);
    if (values.length === 0) {
      continue;
    }
    if (field.kind === 'boolean') {
      result.push({
        path: field.path,
        kind: 'boolean',
        values: [...new Set(values.map((item) => item === 'true'))],
      });
      continue;
    }
    if (field.kind === 'category') {
      result.push({
        path: field.path,
        kind: 'category',
        values: [...new Set(values)],
      });
      continue;
    }
    result.push({
      path: field.path,
      kind: 'datetime',
      values: [...new Set(values)],
    });
  }
  return result;
};
