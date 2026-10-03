/** @type {Readonly<Record<string, string>>} */
const LAYER_ALIAS_DIRS = {
  '@app': 'app',
  '@api': 'api',
  '@use-cases': 'use-cases',
  '@entities': 'entities',
  '@repositories': 'repositories',
  '@infra': 'infra',
  '@views': 'views',
  '@frontend': 'frontend',
  '@test': 'test',
};

const LAYER_ROOTS = [
  { dir: 'frontend/pages', alias: '@frontend/pages' },
  { dir: 'frontend/widgets', alias: '@frontend/widgets' },
  { dir: 'frontend/features', alias: '@frontend/features' },
  { dir: 'frontend/entities', alias: '@frontend/entities' },
  { dir: 'frontend/shared', alias: '@frontend/shared' },
  { dir: 'frontend/app', alias: '@frontend/app' },
  { dir: 'frontend', alias: '@frontend' },
  { dir: 'use-cases', alias: '@use-cases' },
  { dir: 'repositories', alias: '@repositories' },
  { dir: 'entities', alias: '@entities' },
  { dir: 'infra', alias: '@infra' },
  { dir: 'api', alias: '@api' },
  { dir: 'app', alias: '@app' },
  { dir: 'views', alias: '@views' },
  { dir: 'test', alias: '@test' },
];

const toPosix = (value) => value.replace(/\\/g, '/');

const toAlias = (relFromSrc) => {
  const normalized = toPosix(relFromSrc);
  const hit = LAYER_ROOTS.find(
    (layer) =>
      normalized === layer.dir || normalized.startsWith(`${layer.dir}/`),
  );
  if (!hit) {
    return null;
  }
  return `${hit.alias}${normalized.slice(hit.dir.length)}`;
};

const tsconfigPaths = () =>
  Object.fromEntries(
    Object.entries(LAYER_ALIAS_DIRS).map(([alias, dir]) => [
      `${alias}/*`,
      [`${dir}/*`],
    ]),
  );

const jestMapper = (prefix) =>
  Object.fromEntries(
    Object.entries(LAYER_ALIAS_DIRS).map(([alias, dir]) => [
      `^${alias}/(.*)$`,
      `${prefix}/${dir}/$1`,
    ]),
  );

const viteAliasEntries = (srcRoot) => {
  const root = toPosix(srcRoot).replace(/\/$/, '');
  return [
    ...Object.entries(LAYER_ALIAS_DIRS).map(([alias, dir]) => ({
      find: alias,
      replacement: `${root}/${dir}`,
    })),
    {
      find: /^@\//,
      replacement: `${root}/`,
    },
  ];
};

module.exports = {
  LAYER_ALIAS_DIRS,
  LAYER_ROOTS,
  jestMapper,
  toAlias,
  tsconfigPaths,
  viteAliasEntries,
};
