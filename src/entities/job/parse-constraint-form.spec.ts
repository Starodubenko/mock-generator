import { parseConstraintForm } from './parse-constraint-form';
import { constraintFieldsFromProfile } from './constraint-fields-from-profile';

describe('parseConstraintForm', () => {
  const fields = constraintFieldsFromProfile([
    {
      path: 'status',
      pathClass: 'category',
      categoryValues: ['NEW', 'ERROR'],
    },
    {
      path: 'priority',
      pathClass: 'boolean',
    },
    {
      path: 'nested.flag',
      pathClass: 'boolean',
    },
  ]);

  it('should_parse_multiselect_select_and_dotted_boolean', () => {
    const parsed = parseConstraintForm(
      {
        'constraint.status': ['NEW', 'ERROR'],
        'constraint.priority': 'true',
        'constraint.nested.flag': 'true,false',
      },
      fields,
    );
    expect(parsed).toHaveLength(3);
    expect(parsed).toEqual(
      expect.arrayContaining([
        { path: 'status', kind: 'category', values: ['NEW', 'ERROR'] },
        { path: 'priority', kind: 'boolean', values: [true] },
        {
          path: 'nested.flag',
          kind: 'boolean',
          values: [true, false],
        },
      ]),
    );
  });

  it('should_skip_empty_fields', () => {
    expect(parseConstraintForm({ 'constraint.status': '' }, fields)).toEqual(
      [],
    );
  });
});
