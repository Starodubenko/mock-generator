import { Module } from '@nestjs/common';
import { UseCasesModule } from '@use-cases/use-cases.module';
import { HealthController } from './health/health.controller';
import { ProfilesController } from './profiles/profiles.controller';
import { JobsController } from './jobs/jobs.controller';
import { ApiBearerGuard } from './api-bearer.guard';

@Module({
  imports: [UseCasesModule],
  controllers: [HealthController, ProfilesController, JobsController],
  providers: [ApiBearerGuard],
})
export class RestApiModule {}
