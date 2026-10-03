import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AddGroupForm, isBlankGroupName } from './add-group-form';

describe('AddGroupForm html', () => {
  it('should_mark_empty_name_without_inline_error_copy', () => {
    const html = renderToStaticMarkup(
      createElement(AddGroupForm, {
        contour: 'test-stand',
        defaultName: '',
        reason: 'validation_error',
      }),
    );
    expect(html).toContain('data-add-group');
    expect(html).toContain('name="name"');
    expect(html).toContain('required');
    expect(html).toContain('noValidate=""');
    expect(html).toContain('Mui-error');
    expect(html).not.toContain('Ошибка проверки полей');
    expect(html).not.toContain('role="alert"');
  });

  it('should_keep_duplicate_group_alert', () => {
    const html = renderToStaticMarkup(
      createElement(AddGroupForm, {
        contour: 'test-stand',
        defaultName: 'Tasks',
        reason: 'mock_group_exists',
      }),
    );
    expect(html).toContain('Группа с таким именем уже есть');
    expect(html).toContain('role="alert"');
  });

  it('should_treat_blank_name_as_empty', () => {
    expect(isBlankGroupName('')).toBe(true);
    expect(isBlankGroupName('   ')).toBe(true);
    expect(isBlankGroupName('Orders')).toBe(false);
  });
});
