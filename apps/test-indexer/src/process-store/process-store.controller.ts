import { BadRequestException, Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { ServiceAuthGuard } from '../auth/service-auth.guard';
import { PROCESS_STORE_OPS } from './process-store.ops';
import { PostgresProcessStore } from './postgres-process.store';

class ProcessStoreRpcDto {
  @IsString()
  @IsIn([...PROCESS_STORE_OPS])
  op!: string;

  @IsOptional()
  @IsObject()
  args?: Record<string, unknown>;
}

@Controller('internal/v1/process-store')
@UseGuards(ServiceAuthGuard)
export class ProcessStoreController {
  constructor(private readonly store: PostgresProcessStore) {}

  @Post()
  @HttpCode(200)
  async rpc(@Body() body: ProcessStoreRpcDto) {
    try {
      const result = await this.store.dispatch(body.op, body.args ?? {});
      return { result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'process_store_failed';
      throw new BadRequestException({ reason: 'validation_error', message });
    }
  }
}
