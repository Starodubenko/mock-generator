import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FieldHint } from './field-hint';
import { FieldLabel } from './field-label';

describe('FieldHint html', () => {
  it('should_render_question_mark_button_and_tooltip_text', () => {
    const html = renderToStaticMarkup(
      createElement(FieldHint, { text: 'Пояснение поля', tooltipId: 'hint-1' }),
    );
    expect(html).toContain('data-field-hint');
    expect(html).toContain('data-field-hint-pop');
    expect(html).toContain('type="button"');
    expect(html).toContain('Пояснение поля');
    expect(html).toContain('id="hint-1"');
    expect(html).not.toContain('Bearer');
  });
});

describe('FieldLabel html', () => {
  it('should_bind_label_to_control_and_keep_hint', () => {
    const html = renderToStaticMarkup(
      createElement(FieldLabel, {
        htmlFor: 'seed',
        hint: 'Задаёт вариант значений',
        children: 'Ключ вариации',
      }),
    );
    expect(html).toContain('for="seed"');
    expect(html).toContain('Ключ вариации');
    expect(html).toContain('Задаёт вариант значений');
  });
});
