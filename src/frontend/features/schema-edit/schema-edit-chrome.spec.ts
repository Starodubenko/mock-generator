import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SchemaEditButtons, SchemaEditDialogs } from './schema-edit-chrome';

describe('SchemaEditChrome html', () => {
  it('should_render_edit_save_cancel_and_activate_toggle', () => {
    const html = renderToStaticMarkup(
      createElement(
        'div',
        null,
        createElement(SchemaEditButtons),
        createElement(SchemaEditDialogs),
      ),
    );
    expect(html).toContain('Редактировать');
    expect(html).toContain('Добавить поле');
    expect(html).toContain('Имя поля');
    expect(html).toContain('Тип поля');
    expect(html).toContain('id="schema-add-field-name"');
    expect(html).toContain('id="schema-add-field-type"');
    expect(html).toContain('pathClass:__add__');
    expect(html).toContain('array[string]');
    expect(html).toContain('array[object]');
    expect(html).toContain('data-path="__add__"');
    expect(html).toContain('Сохранить');
    expect(html).toContain('Отменить');
    expect(html).toContain('Сохранить новую версию схемы?');
    expect(html).toContain('иммутабельна');
    expect(html).toContain('Сделать активной новую версию');
    expect(html).toContain('role="switch"');
    expect(html).toContain('name="activate"');
    expect(html).toContain('id="schema-enum-value"');
    expect(html).toContain('Например, ERROR');
    expect(html).toContain('Несохранённые изменения схемы будут потеряны');
    expect(html).not.toContain('Bearer');
  });
});
