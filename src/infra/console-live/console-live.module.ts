import { Global, Module } from '@nestjs/common';
import { CONSOLE_LIVE } from '@repositories/console-live.port';
import { ConsoleLiveHub } from './console-live.hub';

@Global()
@Module({
  providers: [
    ConsoleLiveHub,
    {
      provide: CONSOLE_LIVE,
      useExisting: ConsoleLiveHub,
    },
  ],
  exports: [CONSOLE_LIVE, ConsoleLiveHub],
})
export class ConsoleLiveModule {}
