import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsInt, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceAuthGuard } from '../auth/service-auth.guard';
import { IndexesService } from './indexes.service';

class UpsertDocumentDto {
  @IsString()
  id!: string;

  @IsObject()
  body!: Record<string, unknown>;
}

class UpsertBatchDto {
  @IsString()
  contour!: string;

  @IsString()
  jobId!: string;

  @IsInt()
  @Type(() => Number)
  batchNo!: number;

  @IsIn(['canary', 'full'])
  mode!: 'canary' | 'full';

  @ValidateNested({ each: true })
  @Type(() => UpsertDocumentDto)
  documents!: UpsertDocumentDto[];
}

class ContourBodyDto {
  @IsString()
  contour!: string;

  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;
}

@Controller('internal/v1/indexes')
@UseGuards(ServiceAuthGuard)
export class IndexesController {
  constructor(private readonly indexes: IndexesService) {}

  @Get(':index/mapping')
  getMapping(@Param('index') index: string, @Query('contour') contour: string) {
    return this.indexes.getMapping(index, contour);
  }

  @Put(':index/:action')
  upsertBatch(
    @Param('index') index: string,
    @Param('action') action: string,
    @Body() body: UpsertBatchDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    if (action !== 'documents:batch') {
      throw new BadRequestException({ reason: 'missing_required', message: action });
    }
    return this.indexes.upsertBatch({
      index,
      contour: body.contour,
      jobId: body.jobId,
      batchNo: body.batchNo,
      mode: body.mode,
      documents: body.documents,
      idempotencyKey: idempotencyKey || `${body.jobId}:${body.batchNo}`,
    });
  }

  @Post(':indexOrRefresh/search')
  @HttpCode(200)
  search(@Param('indexOrRefresh') index: string, @Body() body: ContourBodyDto) {
    return this.indexes.search(index, body.contour, body.body ?? {});
  }

  @Post(':indexOrRefresh')
  @HttpCode(200)
  refresh(@Param('indexOrRefresh') indexOrRefresh: string, @Body() body: ContourBodyDto) {
    if (!indexOrRefresh.endsWith(':refresh')) {
      throw new BadRequestException({ reason: 'missing_required', message: indexOrRefresh });
    }
    return this.indexes.refresh(indexOrRefresh.slice(0, -':refresh'.length), body.contour);
  }

  @Delete(':index/documents')
  @HttpCode(204)
  async purge(
    @Param('index') index: string,
    @Query('contour') contour: string,
    @Query('jobId') jobId: string,
  ) {
    await this.indexes.purge(index, contour, jobId);
  }
}
