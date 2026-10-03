import { register } from 'tsconfig-paths';

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
} as const;

const paths = Object.fromEntries(
  Object.entries(LAYER_ALIAS_DIRS).map(([alias, dir]) => [
    `${alias}/*`,
    [`${dir}/*`],
  ]),
);

register({
  baseUrl: __dirname,
  paths,
});
