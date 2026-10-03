import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { LAYER_ROOTS, toAlias } = require('./layer-aliases.cjs');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');

const SPEC_PATTERNS = [
  /(from\s+)(['"])([^'"]+)\2/g,
  /(import\s+)(['"])([^'"]+)\2/g,
  /(import\s*\(\s*)(['"])([^'"]+)\2/g,
  /(require\s*\(\s*)(['"])([^'"]+)\2/g,
  /(jest\.mock\s*\(\s*)(['"])([^'"]+)\2/g,
];

const toPosix = (value) => value.replace(/\\/g, '/');

const walk = (dir, acc = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
};

const layerKey = (relFromSrc) => {
  const normalized = toPosix(relFromSrc);
  const hit = LAYER_ROOTS.find(
    (layer) =>
      normalized === layer.dir || normalized.startsWith(`${layer.dir}/`),
  );
  return hit?.dir ?? null;
};

const aliasToSrcRel = (spec) => {
  const hit = LAYER_ROOTS.find(
    (layer) => spec === layer.alias || spec.startsWith(`${layer.alias}/`),
  );
  if (!hit) {
    return null;
  }
  return `${hit.dir}${spec.slice(hit.alias.length)}`;
};

const toRelative = (filePath, targetRelFromSrc) => {
  let rel = toPosix(
    relative(dirname(filePath), join(srcRoot, targetRelFromSrc)),
  );
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel;
};

const fileSrcRel = (filePath) => toPosix(relative(srcRoot, filePath));

const rewriteSpec = (spec, filePath) => {
  const fileRel = fileSrcRel(filePath);
  const fileLayer = layerKey(fileRel);

  if (spec.startsWith('.')) {
    const abs = resolve(dirname(filePath), spec);
    const targetRel = toPosix(relative(srcRoot, abs));
    if (targetRel.startsWith('..')) {
      return spec;
    }
    const targetLayer = layerKey(targetRel);
    if (!targetLayer || targetLayer === fileLayer) {
      return spec;
    }
    return toAlias(targetRel) ?? spec;
  }

  const targetRel = aliasToSrcRel(spec);
  if (!targetRel) {
    return spec;
  }
  const targetLayer = layerKey(targetRel);
  if (!fileLayer || fileLayer !== targetLayer) {
    return spec;
  }
  return toRelative(filePath, targetRel);
};

const rewriteFile = (filePath) => {
  const original = readFileSync(filePath, 'utf8');
  let next = original;
  for (const pattern of SPEC_PATTERNS) {
    next = next.replace(pattern, (full, prefix, quote, spec) => {
      const rewritten = rewriteSpec(spec, filePath);
      if (rewritten === spec) {
        return full;
      }
      return `${prefix}${quote}${rewritten}${quote}`;
    });
  }
  if (next !== original) {
    writeFileSync(filePath, next);
    return true;
  }
  return false;
};

const files = walk(srcRoot);
const changed = files.filter((filePath) => rewriteFile(filePath));
process.stdout.write(`Updated ${changed.length} files.\n`);
