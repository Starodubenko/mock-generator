import type { FC, ReactNode } from 'react';
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import Close from '@mui/icons-material/Close';
import { Box, Chip, Stack, TextField } from '@mui/material';
import { FIELD_HINTS } from '@frontend/shared/i18n/field-hints';
import { FieldLabel } from '@frontend/shared/ui/field-hint/field-label';
import { HoverTip } from '@frontend/shared/ui/hover-tip/hover-tip';

type GetSubmitLook = 'icon' | 'outlined' | 'contained';

type GetSubmitProps = {
  name: string;
  value: string;
  ariaLabel: string;
  disabled?: boolean;
  look: GetSubmitLook;
  children: ReactNode;
} & Record<`data-${string}`, string | undefined>;

export const GENERATE_NAV_ID = 'generate-nav';

export const GetFormSubmit: FC<GetSubmitProps> = (props) => {
  const { name, value, ariaLabel, disabled, look, children, ...data } = props;
  return (
    <button
      type="submit"
      form={GENERATE_NAV_ID}
      name={name}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      {...data}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: 'inherit',
        lineHeight: 1.2,
        cursor: disabled ? 'default' : 'pointer',
        ...(look === 'icon'
          ? {
              border: 0,
              background: 'none',
              padding: 2,
              color: disabled ? 'rgba(0, 0, 0, 0.26)' : '#1976d2',
            }
          : look === 'outlined'
            ? {
                boxSizing: 'border-box',
                height: 40,
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: 4,
                background: '#fff',
                color: 'inherit',
                padding: '0 12px',
                fontSize: 13,
                flexShrink: 0,
              }
            : {
                border: 0,
                borderRadius: 4,
                background: '#1976d2',
                color: '#fff',
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
              }),
      }}
    >
      {children}
    </button>
  );
};

GetFormSubmit.displayName = 'GetFormSubmit';

type NavProps = {
  fields: Array<{ name: string; value: string }>;
};

export const GenerateNavForm: FC<NavProps> = (props) => (
  <form id={GENERATE_NAV_ID} method="get" action="/jobs/new" hidden>
    {props.fields.map((field, index) => (
      <input
        key={`${field.name}:${index}`}
        type="hidden"
        name={field.name}
        value={field.value}
      />
    ))}
  </form>
);

GenerateNavForm.displayName = 'GenerateNavForm';

export const ARRAY_PATHS_RUNTIME = `(function () {
  if (document.documentElement.getAttribute('data-array-paths-runtime') === 'true') {
    return;
  }
  document.documentElement.setAttribute('data-array-paths-runtime', 'true');
  var syncNav = function () {
    var form = document.getElementById('generate-nav');
    if (!form) {
      return null;
    }
    var pairs = [
      ['seed', 'generate-seed'],
      ['count', 'generate-count'],
      ['draftArrayPath', 'draft-array-path'],
    ];
    pairs.forEach(function (pair) {
      var input = form.querySelector('input[name="' + pair[0] + '"]');
      var live = document.getElementById(pair[1]);
      if (input && live) {
        input.value = live.value;
      }
    });
    var versionLive = document.querySelector('input[name="profileVersionId"]');
    var versionHidden = form.querySelector('input[name="profileVersionId"]');
    if (versionLive && versionHidden) {
      versionHidden.value = versionLive.value;
    }
    form.querySelectorAll('[data-nav-constraint]').forEach(function (node) {
      node.remove();
    });
    document.querySelectorAll('[name^="constraint."]').forEach(function (field) {
      if (!field.value) {
        return;
      }
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = field.name;
      hidden.value = field.value;
      hidden.setAttribute('data-nav-constraint', '1');
      form.appendChild(hidden);
    });
    return form;
  };
  document.addEventListener(
    'click',
    function (event) {
      var target = event.target;
      if (!target || !target.closest) {
        return;
      }
      var button = target.closest(
        '[data-add-array-path], [data-remove-array-path], [name="confirmStart"]',
      );
      if (!button) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled) {
        return;
      }
      var form = syncNav();
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit(button);
      }
    },
    true,
  );
})();`;

type ListProps = {
  paths: string[];
  draftPath: string;
};

export const ArrayPathsField: FC<ListProps> = (props) => {
  const { paths, draftPath } = props;
  return (
    <Box sx={{ minWidth: 0 }} data-array-paths="">
      <FieldLabel htmlFor="draft-array-path" hint={FIELD_HINTS.arrayPaths}>
        Пути массивов
      </FieldLabel>
      <Stack
        direction="row"
        spacing={1}
        data-array-paths-control=""
        sx={{ alignItems: 'center', minHeight: 40 }}
      >
        <TextField
          id="draft-array-path"
          name="draftArrayPath"
          size="small"
          placeholder="hits.hits"
          defaultValue={draftPath}
          hiddenLabel
          sx={{ flex: 1, minWidth: 0 }}
        />
        <HoverTip text={FIELD_HINTS.addArrayPath}>
          <GetFormSubmit
            name="confirmAddFromDraft"
            value="1"
            look="outlined"
            data-add-array-path=""
            ariaLabel={FIELD_HINTS.addArrayPath}
          >
            Добавить путь
          </GetFormSubmit>
        </HoverTip>
      </Stack>
      {paths.length > 0 ? (
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}
        >
          {paths.map((path) => (
            <Stack
              key={path}
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center' }}
              data-array-path-chip={path}
            >
              <Chip size="small" label={path} />
              <HoverTip text={FIELD_HINTS.removeArrayPath}>
                <GetFormSubmit
                  name="confirmRemoveArrayPath"
                  value={path}
                  look="icon"
                  data-remove-array-path={path}
                  ariaLabel={`Убрать путь ${path}`}
                >
                  <Close sx={{ fontSize: 16 }} />
                </GetFormSubmit>
              </HoverTip>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Box sx={{ color: 'text.secondary', fontSize: 13, mt: 1 }}>
          Пусто — сгенерируется список корневых документов.
        </Box>
      )}
      <script dangerouslySetInnerHTML={{ __html: ARRAY_PATHS_RUNTIME }} />
    </Box>
  );
};

ArrayPathsField.displayName = 'ArrayPathsField';

type ActionProps = {
  path: string;
  selected: boolean;
};

export const AddArrayPathButton: FC<ActionProps> = (props) => {
  const { path, selected } = props;
  const hint = selected ? 'Этот путь уже в списке' : FIELD_HINTS.addArrayPath;
  return (
    <HoverTip text={hint} tooltipId={`add-array-${path}`}>
      <GetFormSubmit
        name="confirmAddArrayPath"
        value={path}
        look="icon"
        disabled={selected}
        data-add-array-path={path}
        ariaLabel={hint}
      >
        <PlaylistAdd sx={{ fontSize: 18 }} />
      </GetFormSubmit>
    </HoverTip>
  );
};

AddArrayPathButton.displayName = 'AddArrayPathButton';
