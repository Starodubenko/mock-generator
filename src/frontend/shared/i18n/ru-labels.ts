const REASON_LABELS: Record<string, string> = {
  empty_corpus: 'Корпус пуст. Приложите эталонные файлы JSON или NDJSON.',
  mixed_types: 'В выборке смешаны типы документов',
  type_conflict: 'Конфликт типов или версия не активируется',
  below_min_sample: 'Выборка меньше минимального размера',
  prod_target: 'Цель или контур запрещены (prod / allow-list)',
  source_is_synthetic: 'Источник помечен как синтетический',
  canary_failed: 'Пробная пачка или золотые запросы не прошли',
  poison_ratio: 'Слишком много отказов соседнего микросервиса (ядовитые ответы)',
  invariant_exhausted: 'Не удалось набрать пачку с инвариантами',
  mapping_incompatible: 'Несовместимость с маппингом индекса',
  missing_required: 'Не хватает обязательных данных',
  link_outside_job: 'Ссылка вне текущего задания',
  transport_rejected: 'Отказ транспорта или авторизации',
  idempotency_conflict: 'Конфликт идемпотентности или задание уже завершено',
  validation_error: 'Ошибка проверки полей или эталонного файла',
  mock_group_exists: 'Группа с таким именем уже есть',
  mock_endpoint_exists: 'Эндпоинт с таким методом и путём уже есть',
  array_path_invalid:
    'Путь должен быть массивом из схемы профиля. Повторы отбрасываются.',
};

export const formatReason = (reason: string | null): string => {
  if (!reason) {
    return '';
  }
  return REASON_LABELS[reason] ?? reason;
};

const JOB_STATE_LABELS: Record<string, string> = {
  accepted: 'принято',
  profiling: 'профилирование',
  profile_ready: 'профиль готов',
  activating: 'активация',
  preview: 'черновик',
  canary: 'пробная пачка',
  running: 'публикация',
  succeeded: 'успех',
  failed: 'ошибка',
  cancelled: 'отменено',
};

export const formatJobState = (state: string): string =>
  JOB_STATE_LABELS[state] ?? state;

const JOB_KIND_LABELS: Record<string, string> = {
  train: 'обучение',
  generate: 'генерация',
};

export const formatJobKind = (kind: string): string =>
  JOB_KIND_LABELS[kind] ?? kind;

export const formatDocumentType = (documentType: string): string =>
  documentType;
