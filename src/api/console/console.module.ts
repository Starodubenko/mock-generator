import { Module } from '@nestjs/common';
import { UseCasesModule } from '@use-cases/use-cases.module';
import { HomeConsoleController } from './home/home-console.controller';
import { DocumentTypesConsoleController } from './document-types/document-types-console.controller';
import { ProfilesConsoleController } from './profiles/profiles-console.controller';
import { JobsConsoleController } from './jobs/jobs-console.controller';
import { MocksConsoleController } from './mocks/mocks-console.controller';
import { ConsoleSessionGuard } from './console-session.guard';
import { ConsoleJsonGuard } from './console-json.guard';

@Module({
  imports: [UseCasesModule],
  controllers: [
    HomeConsoleController,
    DocumentTypesConsoleController,
    ProfilesConsoleController,
    JobsConsoleController,
    MocksConsoleController,
  ],
  providers: [ConsoleSessionGuard, ConsoleJsonGuard],
})
export class ConsoleModule {}
