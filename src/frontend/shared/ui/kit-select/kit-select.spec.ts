import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KitSelect } from './kit-select';
import { KIT_SELECT_RUNTIME } from './kit-select-runtime';

describe('KitSelect html', () => {
  it('should_render_mui_menu_dropdown_without_native_select', () => {
    const html = renderToStaticMarkup(
      createElement(KitSelect, {
        id: 'profile-version-select',
        name: 'profileVersionId',
        defaultValue: '',
        options: [{ value: '', label: 'Рабочая версия контура' }],
      }),
    );
    expect(html).toContain('data-kit-select');
    expect(html).toContain('data-kit-select-trigger');
    expect(html).toContain('data-kit-select-menu');
    expect(html).toContain('MuiMenuItem');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('ArrowDropDown');
    expect(html).toContain('id="profile-version-select"');
    expect(html).toContain('name="profileVersionId"');
    expect(html).toContain('Рабочая версия контура');
    expect(html).toContain(KIT_SELECT_RUNTIME);
    expect(html).not.toMatch(/<select[\s>]/);
    expect(html).not.toContain('data-native-dropdown');
    expect(html).not.toContain('Bearer');
  });
});

describe('KIT_SELECT_RUNTIME', () => {
  it('should_submit_owner_form_and_avoid_native_select', () => {
    expect(KIT_SELECT_RUNTIME).toContain('form.submit()');
    expect(KIT_SELECT_RUNTIME).toContain('data-kit-select-menu');
    expect(KIT_SELECT_RUNTIME).toContain('data-kit-select-runtime');
    expect(KIT_SELECT_RUNTIME).toContain("document.addEventListener('click'");
    expect(KIT_SELECT_RUNTIME).not.toContain('document.currentScript');
    expect(KIT_SELECT_RUNTIME).not.toContain("querySelector('select");
    expect(KIT_SELECT_RUNTIME).not.toContain('Bearer');
  });
});
