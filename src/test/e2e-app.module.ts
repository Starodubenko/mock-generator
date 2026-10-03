import { Module } from '@nestjs/common';
import { LocalDataModule } from '@infra/local-data/local-data.module';
import { RestApiModule } from '@api/rest/rest-api.module';

@Module({
  imports: [LocalDataModule, RestApiModule],
})
export class E2eAppModule {}
