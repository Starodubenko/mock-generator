import { formatReason } from './ru-labels';

export const TOAST_CODES = [
  'training_started',
  'generate_started',
  'published',
  'activated',
  'rolled_back',
  'cancelled',
  'enum_added',
  'alias_saved',
  'version_deleted',
  'type_added',
  'type_deleted',
  'schema_saved',
  'schema_saved_activated',
  'schema_edit_started',
  'schema_enum_drafted',
  'schema_edit_discarded',
  'mock_resource_saved',
  'mock_catalog_saved',
  'mock_endpoint_deleted',
] as const;

export type ToastCode = (typeof TOAST_CODES)[number];

export type ToastCopy = {
  title: string;
  body: string;
};

const TOAST_COPY: Record<ToastCode, ToastCopy> = {
  training_started: {
    title: 'Обучение принято',
    body: 'Версия появится на карточке задания. Активация — отдельный шаг.',
  },
  generate_started: {
    title: 'Генерация принята',
    body: 'Когда черновик будет готов, откройте просмотр и опубликуйте пачку на стенд.',
  },
  published: {
    title: 'Пачка ушла на стенд',
    body: 'Сначала пробная пачка и золотые запросы, затем полная заливка.',
  },
  activated: {
    title: 'Версия активирована',
    body: 'Эта версия стала рабочей для текущего контура.',
  },
  rolled_back: {
    title: 'Откат выполнен',
    body: 'Рабочей снова стала прежняя версия.',
  },
  cancelled: {
    title: 'Задание отменено',
    body: 'Новое задание можно запустить с тем же ключом вариации и новым идентификатором.',
  },
  enum_added: {
    title: 'Значение добавлено',
    body: 'Enum обновлён в модели генерации. Переобучать профиль не нужно.',
  },
  alias_saved: {
    title: 'Алиас сохранён',
    body: 'В списках и селектах версия показывается вместе с этим именем.',
  },
  version_deleted: {
    title: 'Версия удалена',
    body: 'Она больше не в списке этого контура. Рабочая версия не менялась.',
  },
  type_added: {
    title: 'Тип добавлен',
    body: 'Теперь его можно обучить. Профили появятся внутри блока типа.',
  },
  type_deleted: {
    title: 'Тип удалён',
    body: 'Его профили в этом процессе тоже сняты.',
  },
  schema_saved: {
    title: 'Новая версия схемы',
    body: 'Исходная версия не переписывалась. Рабочая версия контура не менялась.',
  },
  schema_saved_activated: {
    title: 'Новая версия схемы',
    body: 'Она стала рабочей для этого контура. Исходная версия не изменялась.',
  },
  schema_edit_started: {
    title: 'Режим правки',
    body: 'Можно менять имена и типы, добавлять поля. Сохранение создаст новую версию схемы.',
  },
  schema_enum_drafted: {
    title: 'Значение добавлено',
    body: 'Оно попадёт в новую версию после сохранения. Текущий снимок не менялся.',
  },
  schema_edit_discarded: {
    title: 'Правки отменены',
    body: 'Схема вернулась к сохранённому снимку этой версии.',
  },
  mock_resource_saved: {
    title: 'Ресурс сохранён',
    body: 'JSON черновика отдаётся по указанному пути на индексере и на пульте.',
  },
  mock_catalog_saved: {
    title: 'Каталог обновлён',
    body: 'Группа или эндпоинт появились на вкладке Моки.',
  },
  mock_endpoint_deleted: {
    title: 'Удалено из каталога',
    body: 'Операция больше не в списке. Публичный путь снова отвечает 404.',
  },
};

export const isToastCode = (value: string): value is ToastCode =>
  (TOAST_CODES as readonly string[]).includes(value);

export const formatToastCopy = (code: string): ToastCopy => {
  if (isToastCode(code)) {
    return TOAST_COPY[code];
  }
  return { title: 'Не получилось', body: formatReason(code) || code };
};

export const formatToast = (code: string): string => {
  const copy = formatToastCopy(code);
  return `${copy.title}. ${copy.body}`;
};

export const toastSeverity = (
  code: string,
): 'success' | 'error' | 'info' | 'warning' => {
  if (code === 'cancelled' || code === 'rolled_back') {
    return 'warning';
  }
  if (isToastCode(code)) {
    return 'success';
  }
  return 'error';
};
