import type { FC } from 'react';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import { Box, FormControl, MenuItem, MenuList, Paper } from '@mui/material';
import { KIT_SELECT_RUNTIME } from './kit-select-runtime';

export type KitSelectOption = {
  value: string;
  label: string;
};

type Props = {
  id?: string;
  name?: string;
  defaultValue?: string;
  options: KitSelectOption[];
  variant?: 'paper' | 'appbar';
  fullWidth?: boolean;
  maxWidth?: number | string;
  submitOnChange?: boolean;
  actionPrefix?: string;
  'aria-label'?: string;
};

export const KitSelect: FC<Props> = (props) => {
  const {
    id,
    name,
    defaultValue = '',
    options,
    variant = 'paper',
    fullWidth = true,
    maxWidth,
    submitOnChange = false,
    actionPrefix,
    'aria-label': ariaLabel,
  } = props;
  const paper = variant === 'paper';
  const selected =
    options.find((option) => option.value === defaultValue) ?? options[0];
  const menuId = id ? `${id}-menu` : undefined;
  return (
    <FormControl
      data-kit-select=""
      data-kit-values={options.map((option) => option.value).join(',')}
      data-submit-on-change={submitOnChange ? 'true' : undefined}
      data-action-prefix={actionPrefix}
      size="small"
      fullWidth={paper && fullWidth}
      sx={{
        position: 'relative',
        width: maxWidth ?? (paper && fullWidth ? 1 : 'auto'),
        minWidth: paper ? undefined : 180,
        maxWidth,
      }}
    >
      {name ? (
        <input
          type="hidden"
          name={name}
          defaultValue={selected?.value ?? ''}
          data-kit-select-value=""
        />
      ) : null}
      <Box
        component="button"
        type="button"
        id={id}
        data-kit-select-trigger=""
        data-value={selected?.value ?? ''}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls={menuId}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 1,
          height: paper ? '40px' : '36px',
          minHeight: paper ? '40px' : '36px',
          boxSizing: 'border-box',
          m: 0,
          px: 1.5,
          py: 0,
          border: paper ? 1 : 0,
          borderColor: 'rgba(0, 0, 0, 0.23)',
          borderRadius: 1,
          bgcolor: 'common.white',
          color: 'text.primary',
          cursor: 'pointer',
          font: 'inherit',
          fontSize: 14,
          lineHeight: 1.4,
          textAlign: 'left',
          appearance: 'none',
        }}
      >
        <Box
          component="span"
          data-kit-select-label=""
          sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {selected?.label ?? ''}
        </Box>
        <ArrowDropDown sx={{ color: 'action.active', mr: -0.5 }} />
      </Box>
      <Paper
        id={menuId}
        data-kit-select-menu=""
        data-open="false"
        role="listbox"
        elevation={8}
        sx={{ display: 'none', position: 'absolute', py: 0.5 }}
      >
        <MenuList dense>
          {options.map((option) => (
            <MenuItem
              key={`${option.value}:${option.label}`}
              component="button"
              type="button"
              value={option.value}
              data-value={option.value}
              selected={option.value === (selected?.value ?? '')}
              sx={{ width: 1, justifyContent: 'flex-start' }}
            >
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </Paper>
      <script dangerouslySetInnerHTML={{ __html: KIT_SELECT_RUNTIME }} />
    </FormControl>
  );
};

KitSelect.displayName = 'KitSelect';
