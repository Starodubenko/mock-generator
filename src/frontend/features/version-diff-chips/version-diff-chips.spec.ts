import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  HYSTERESIS_CHIP_HINT,
  VersionDiffChip,
  VersionDiffDialogs,
  diffChipValue,
} from './version-diff-chips';
import { VERSION_DIFF_RUNTIME } from './version-diff-runtime';

describe('diffChipValue', () => {
  it('should_use_net_when_empty', () => {
    expect(diffChipValue([])).toBe('нет');
  });

  it('should_use_count_when_paths_exist', () => {
    expect(diffChipValue(['a', 'b'])).toBe('2');
  });
});

describe('VersionDiffChip html', () => {
  it('should_not_open_dialog_when_empty', () => {
    const html = renderToStaticMarkup(
      createElement(VersionDiffChip, {
        label: 'Добавлено',
        field: 'added',
        value: 'нет',
      }),
    );
    expect(html).toContain('data-version-chip="added"');
    expect(html).toContain('нет');
    expect(html).not.toContain('data-diff-open');
  });

  it('should_mark_count_chip_as_dialog_trigger', () => {
    const html = renderToStaticMarkup(
      createElement(VersionDiffChip, {
        label: 'Добавлено',
        field: 'added',
        value: '2',
        interactive: true,
      }),
    );
    expect(html).toContain('data-diff-open="added"');
    expect(html).toContain('type="button"');
    expect(html).toContain('>2<');
  });

  it('should_explain_hysteresis_on_hover', () => {
    const html = renderToStaticMarkup(
      createElement(VersionDiffChip, {
        label: 'Удержано гистерезисом',
        field: 'hysteresis',
        value: '5',
        interactive: true,
        hint: HYSTERESIS_CHIP_HINT,
      }),
    );
    expect(html).toContain('data-hover-tip');
    expect(html).toContain(HYSTERESIS_CHIP_HINT);
    expect(html).toContain('два порога');
    expect(html).toContain('нижний порог');
    expect(html).not.toContain('level');
    expect(html).not.toContain('Bearer');
  });
});

describe('VersionDiffDialogs html', () => {
  it('should_list_added_paths_without_secrets', () => {
    const html = renderToStaticMarkup(
      createElement(VersionDiffDialogs, {
        groups: [
          {
            field: 'added',
            label: 'Добавлено',
            title: 'Добавленные поля',
            items: ['childItems', 'status'],
          },
          {
            field: 'removed',
            label: 'Удалено',
            title: 'Удалённые поля',
            items: [],
          },
        ],
      }),
    );
    expect(html).toContain('Добавленные поля');
    expect(html).toContain('2 поля относительно');
    expect(html).toContain('data-diff-list="added"');
    expect(html).toContain('childItems');
    expect(html).toContain('status');
    expect(html).toContain(VERSION_DIFF_RUNTIME);
    expect(html).not.toContain('Удалённые поля');
    expect(html).not.toContain('Bearer');
  });
});
