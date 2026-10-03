import type { FC, ReactNode } from 'react';
import { Box, Link, Typography } from '@mui/material';
import ChevronRight from '@mui/icons-material/ChevronRight';
import {
  buildSchemaTree,
  type SchemaNode,
  type SchemaPath,
} from '../../lib/schema-tree';
import { KitSelect } from '../kit-select/kit-select';
import { PATH_CLASS_OPTIONS, pathClassSelectValue } from './path-class-options';
import {
  isCollapsibleNode,
  formatTypeVariants,
  swaggerTypeColor,
} from './schema-type';

type Props = {
  paths: SchemaPath[];
  renderControl?: (node: SchemaNode) => ReactNode;
  renderArrayAction?: (node: SchemaNode) => ReactNode;
  fill?: boolean;
  typeEdit?: boolean;
};

type RowProps = {
  node: SchemaNode;
  depth: number;
  renderControl?: (node: SchemaNode) => ReactNode;
  renderArrayAction?: (node: SchemaNode) => ReactNode;
  typeEdit?: boolean;
  compactTail?: boolean;
};

const CONTROL_COL_WIDTH = '230px';

const rowSx = {
  display: 'flex',
  alignItems: 'center',
  columnGap: 1,
  minHeight: '40px',
  width: 'max-content',
  minWidth: '100%',
} as const;

const TypeWord: FC<{ label: string }> = (props) => {
  const { label } = props;
  return (
    <Box
      component="span"
      sx={{
        color: swaggerTypeColor(label),
        fontWeight: 600,
        letterSpacing: 0.2,
      }}
    >
      {label}
    </Box>
  );
};

const TypeMark: FC<{
  pathClass: string;
  datetimeFormat?: string;
  itemPathClass?: string;
  itemDatetimeFormat?: string;
  typeVariants?: string[];
  nullRate?: number;
  enumHint?: boolean;
}> = (props) => {
  const {
    pathClass,
    datetimeFormat,
    itemPathClass,
    itemDatetimeFormat,
    typeVariants,
    nullRate,
    enumHint = false,
  } = props;
  const tokens = formatTypeVariants({
    pathClass,
    datetimeFormat,
    itemPathClass,
    itemDatetimeFormat,
    typeVariants,
    nullRate,
  });
  return (
    <Box
      data-schema-type-mark=""
      sx={{
        display: 'inline-flex',
        alignItems: 'baseline',
        columnGap: 0.75,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {tokens.map((token, index) => (
        <Box
          key={`${token}-${index}`}
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'baseline',
            columnGap: 0.75,
          }}
        >
          {index > 0 ? (
            <Box
              component="span"
              sx={{ color: 'text.secondary', fontWeight: 600 }}
            >
              |
            </Box>
          ) : null}
          <TypeWord label={token} />
        </Box>
      ))}
      {enumHint ? (
        <Box
          component="span"
          sx={{ color: swaggerTypeColor('string'), fontWeight: 500 }}
        >
          enum
        </Box>
      ) : null}
    </Box>
  );
};

const NameCell: FC<{ depth: number; children: ReactNode }> = (props) => {
  const { depth, children } = props;
  return (
    <Box
      sx={{
        color: '#3b4151',
        fontWeight: 600,
        pl: `${depth * 20}px`,
        minWidth: '140px',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  );
};

const NameEditor: FC<{ path: string; name: string }> = (props) => {
  const { path, name } = props;
  return (
    <Box
      component="input"
      data-schema-name-edit=""
      data-original={name}
      name={`pathName:${path}`}
      defaultValue={name}
      aria-label={`Имя ${path}`}
      autoComplete="off"
      sx={{
        display: 'none',
        boxSizing: 'border-box',
        width: 140,
        minWidth: 140,
        height: 28,
        m: 0,
        px: 1,
        border: 1,
        borderColor: 'rgba(0, 0, 0, 0.23)',
        borderRadius: 1,
        bgcolor: 'common.white',
        color: '#3b4151',
        font: 'inherit',
        fontWeight: 600,
      }}
    />
  );
};

const RowShell: FC<{
  depth: number;
  path?: string;
  toggle?: ReactNode;
  name: ReactNode;
  type?: ReactNode;
  tail?: ReactNode;
  close?: boolean;
  compactTail?: boolean;
  component?: 'div' | 'summary';
}> = (props) => {
  const {
    depth,
    path,
    toggle,
    name,
    type,
    tail,
    close = false,
    compactTail = false,
    component = 'div',
  } = props;
  return (
    <Box
      component={component}
      data-schema-row={close ? undefined : ''}
      data-path={close ? undefined : path}
      sx={{
        ...rowSx,
        ...(component === 'summary'
          ? {
              listStyle: 'none',
              cursor: 'pointer',
              '&::-webkit-details-marker': { display: 'none' },
            }
          : {}),
      }}
    >
      <Box
        sx={{
          width: '22px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {toggle}
      </Box>
      <NameCell depth={depth}>{name}</NameCell>
      <Box
        component="span"
        sx={{
          color: 'text.secondary',
          flexShrink: 0,
          width: '8px',
          textAlign: 'center',
        }}
      >
        {close ? '' : ':'}
      </Box>
      <Box
        data-schema-type-slot=""
        sx={{
          flexShrink: 0,
          width: 'auto',
          minWidth: '78px',
        }}
      >
        {close ? null : type}
      </Box>
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          overflow: 'visible',
          ...(compactTail
            ? {
                width: CONTROL_COL_WIDTH,
                minWidth: CONTROL_COL_WIDTH,
                maxWidth: CONTROL_COL_WIDTH,
              }
            : { width: 'auto', maxWidth: 'none' }),
        }}
      >
        {tail}
      </Box>
    </Box>
  );
};

const TypeEditor: FC<{ node: SchemaNode }> = (props) => {
  const { node } = props;
  const selectValue = pathClassSelectValue(
    node.pathClass,
    node.datetimeFormat,
    node.itemPathClass,
    node.itemDatetimeFormat,
  );
  const selected = PATH_CLASS_OPTIONS.find(
    (item) => item.value === selectValue,
  );
  const values =
    (node.pathClass === 'array'
      ? node.itemCategoryValues
      : node.categoryValues
    )?.join(', ') ?? '';
  return (
    <Box
      data-schema-type-edit=""
      sx={{ display: 'none', alignItems: 'center', gap: 1, minWidth: 0 }}
    >
      <Box
        data-schema-changed=""
        title="Изменено"
        aria-label="Изменено"
        sx={{
          display: 'none',
          width: 10,
          height: 10,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: '#ff3d00',
          boxShadow: '0 0 0 4px rgba(255, 61, 0, 0.28)',
        }}
      />
      <Box
        data-schema-path-class=""
        data-original={selectValue}
        data-original-label={selected?.label ?? selectValue}
        sx={{ width: '160px', minWidth: '160px' }}
      >
        <KitSelect
          id={`schema-type-${node.path.split('.').join('-')}`}
          name={`pathClass:${node.path}`}
          defaultValue={selectValue}
          fullWidth
          maxWidth="160px"
          aria-label={`Тип ${node.path}`}
          options={[...PATH_CLASS_OPTIONS]}
        />
      </Box>
      <Box
        component="span"
        data-schema-enum-caption={node.path}
        data-original-values={values}
        sx={{
          display: 'none',
          color: 'text.secondary',
          fontSize: 12,
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          maxWidth: 'none',
        }}
      >
        {values ? `[${values}]` : '[]'}
      </Box>
      <Link
        data-schema-enum-edit=""
        data-path={node.path}
        href="#schema-enum"
        variant="caption"
        underline="hover"
        sx={{ display: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        Изменить
      </Link>
      <input
        type="hidden"
        name={`enumAdded:${node.path}`}
        defaultValue=""
        data-enum-added={node.path}
      />
    </Box>
  );
};

const SchemaNodeRow: FC<RowProps> = (props) => {
  const {
    node,
    depth,
    renderControl,
    renderArrayAction,
    typeEdit = false,
    compactTail = false,
  } = props;
  const control = renderControl?.(node);
  const arrayAction =
    node.pathClass === 'array' ? renderArrayAction?.(node) : null;
  const collapsible = isCollapsibleNode(
    node.pathClass,
    node.children.length,
    node.itemPathClass,
  );
  const isArray = node.pathClass === 'array';
  const openToken = isArray ? '[' : '{';
  const closeToken = isArray ? ']' : '}';
  const typeMark = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box data-schema-type-view="">
        <TypeMark
          pathClass={node.pathClass}
          datetimeFormat={node.datetimeFormat}
          itemPathClass={node.itemPathClass}
          itemDatetimeFormat={node.itemDatetimeFormat}
          typeVariants={node.typeVariants}
          nullRate={node.nullRate}
          enumHint={
            !control &&
            (node.pathClass === 'category' ||
              (node.pathClass === 'array' && node.itemPathClass === 'category'))
          }
        />
      </Box>
      {typeEdit ? <TypeEditor node={node} /> : null}
      {arrayAction}
    </Box>
  );
  const enumValues =
    (node.pathClass === 'array'
      ? node.itemCategoryValues
      : node.categoryValues
    )?.join(', ') ?? '';
  const enumCaption =
    !control &&
    (node.pathClass === 'category' ||
      (node.pathClass === 'array' && node.itemPathClass === 'category')) ? (
      <Box
        data-schema-enum-tail=""
        sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ whiteSpace: 'nowrap' }}
        >
          [{enumValues}]
        </Typography>
      </Box>
    ) : (
      control
    );

  const fieldName = (
    <>
      <Box component="span" data-schema-name-view="">
        {node.name}
      </Box>
      {typeEdit ? <NameEditor path={node.path} name={node.name} /> : null}
    </>
  );
  if (!collapsible) {
    return (
      <RowShell
        depth={depth}
        path={node.path}
        name={fieldName}
        type={typeMark}
        tail={enumCaption}
        compactTail={compactTail}
      />
    );
  }

  return (
    <Box
      component="details"
      open
      sx={{
        width: 'max-content',
        minWidth: '100%',
        '&[open] .schema-chevron': { transform: 'rotate(90deg)' },
        '&[open] .schema-ellipsis': { display: 'none' },
        '&:not([open]) .schema-ellipsis': { display: 'inline' },
      }}
    >
      <RowShell
        component="summary"
        depth={depth}
        path={node.path}
        toggle={
          <ChevronRight
            className="schema-chevron"
            fontSize="small"
            sx={{ transition: 'transform 120ms ease', color: 'text.secondary' }}
          />
        }
        name={fieldName}
        type={typeMark}
        compactTail={compactTail}
        tail={
          <Box component="span" sx={{ color: 'text.secondary' }}>
            {openToken}
            <Box component="span" className="schema-ellipsis">
              {' … '}
              {closeToken}
            </Box>
          </Box>
        }
      />
      {node.children.map((child) => (
        <SchemaNodeRow
          key={child.path}
          node={child}
          depth={depth + 1}
          renderControl={renderControl}
          renderArrayAction={renderArrayAction}
          typeEdit={typeEdit}
          compactTail={compactTail}
        />
      ))}
      <RowShell
        depth={depth}
        name={closeToken}
        close
        compactTail={compactTail}
      />
    </Box>
  );
};

export const SchemaTree: FC<Props> = (props) => {
  const {
    paths,
    renderControl,
    renderArrayAction,
    fill = false,
    typeEdit = false,
  } = props;
  const tree = buildSchemaTree(paths);
  return (
    <Box
      data-schema-tree=""
      data-schema-scroll={fill ? '' : undefined}
      sx={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 13,
        lineHeight: 1.55,
        bgcolor: '#fafafa',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        px: 2,
        py: 1.5,
        overflow: 'auto',
        overflowX: 'auto',
        minWidth: 0,
        maxWidth: 1,
        ...(fill ? { flex: 1, minHeight: 0, height: 1 } : {}),
      }}
    >
      <Box sx={{ minWidth: 'max-content', width: 1 }}>
        <Box sx={{ color: 'text.secondary', mb: 0.5 }}>{'{'}</Box>
        {tree.map((node) => (
          <SchemaNodeRow
            key={node.path}
            node={node}
            depth={0}
            renderControl={renderControl}
            renderArrayAction={renderArrayAction}
            typeEdit={typeEdit}
            compactTail={Boolean(renderControl)}
          />
        ))}
        {typeEdit ? <Box data-schema-added-host="" /> : null}
        <Box sx={{ color: 'text.secondary' }}>{'}'}</Box>
      </Box>
    </Box>
  );
};

SchemaTree.displayName = 'SchemaTree';
