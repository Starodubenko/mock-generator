import {
  formatToast,
  formatToastCopy,
  isToastCode,
  toastSeverity,
} from './toast-labels';

describe('toast-labels', () => {
  it('should_translate_success_and_error_codes', () => {
    expect(formatToast('training_started')).toContain('Обучение принято');
    expect(formatToast('empty_corpus')).toContain('Корпус пуст');
    expect(isToastCode('activated')).toBe(true);
    expect(isToastCode('published')).toBe(true);
    expect(formatToast('published')).toContain('на стенд');
    expect(isToastCode('enum_added')).toBe(true);
    expect(formatToast('enum_added')).toContain('Переобучать');
    expect(isToastCode('alias_saved')).toBe(true);
    expect(formatToast('version_deleted')).toContain('удалена');
    expect(formatToast('type_added')).toContain('Тип добавлен');
    expect(formatToast('type_deleted')).toContain('Тип удалён');
    expect(formatToast('schema_saved')).toContain('не переписывалась');
    expect(formatToast('schema_saved_activated')).toContain('стала рабочей');
    expect(formatToast('schema_edit_started')).toContain('Режим правки');
    expect(formatToastCopy('schema_edit_started').body).toContain(
      'добавлять поля',
    );
    expect(formatToast('schema_enum_drafted')).toContain('Значение добавлено');
    expect(formatToast('schema_edit_discarded')).toContain('Правки отменены');
    expect(formatToast('mock_resource_saved')).toContain('Ресурс сохранён');
    expect(formatToast('mock_catalog_saved')).toContain('Каталог обновлён');
    expect(formatToast('mock_endpoint_deleted')).toContain('Удалено из каталога');
    expect(toastSeverity('cancelled')).toBe('warning');
    expect(toastSeverity('rolled_back')).toBe('warning');
    expect(toastSeverity('type_conflict')).toBe('error');
    expect(formatToast('mock_group_exists')).toContain('уже есть');
    expect(formatToast('mock_endpoint_exists')).toContain('путём уже есть');
    expect(toastSeverity('mock_group_exists')).toBe('error');
  });
});
