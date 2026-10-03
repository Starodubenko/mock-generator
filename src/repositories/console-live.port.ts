import type { ConsoleLiveJobEvent } from '@entities/console-live/console-live.contract';

export const CONSOLE_LIVE = Symbol('CONSOLE_LIVE');

export abstract class ConsoleLivePort {
  abstract publish(event: ConsoleLiveJobEvent): void;
}
