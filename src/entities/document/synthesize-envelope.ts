import { getByPath, replaceByPath } from '../profile/path-value';
import {
  synthesizeDocument,
  type SynthesizeInput,
} from './synthesize-document';

export type SynthesizeEnvelopeInput = SynthesizeInput & {
  count: number;
  arrayPaths: string[];
};

const firstArrayItem = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value[0] ?? {};
  }
  return value ?? {};
};

export const synthesizeEnvelope = (
  input: SynthesizeEnvelopeInput,
): Record<string, unknown> => {
  const shells: Record<string, unknown>[] = [];
  for (let number = 1; number <= input.count; number += 1) {
    shells.push(
      synthesizeDocument({
        ...input,
        number,
        expandArrayPaths: input.arrayPaths,
      }),
    );
  }
  const envelope = structuredClone(shells[0] ?? {}) as Record<string, unknown>;
  for (const path of input.arrayPaths) {
    replaceByPath(
      envelope,
      path,
      shells.map((document) => firstArrayItem(getByPath(document, path))),
    );
  }
  return envelope;
};
