import { Body, Controller, Delete, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceAuthGuard } from '../auth/service-auth.guard';
import { SnapshotsService } from './snapshots.service';

class OpenSnapshotDto {
  @IsString()
  contour!: string;

  @IsString()
  sourceIndex!: string;

  @IsInt()
  @Type(() => Number)
  sampleSize!: number;
}

class ReadSnapshotDto {
  @IsString()
  contour!: string;

  @IsOptional()
  cursor?: string | null;

  @IsInt()
  @Type(() => Number)
  limit!: number;
}

@Controller('internal/v1/corpus/snapshots')
@UseGuards(ServiceAuthGuard)
export class SnapshotsController {
  constructor(private readonly snapshots: SnapshotsService) {}

  @Post()
  @HttpCode(201)
  async open(@Body() body: OpenSnapshotDto) {
    return this.snapshots.open(body);
  }

  @Post(':snapshotId/pages')
  read(@Param('snapshotId') snapshotId: string, @Body() body: ReadSnapshotDto) {
    return this.snapshots.read({ ...body, snapshotId });
  }

  @Delete(':snapshotId')
  @HttpCode(204)
  async close(@Param('snapshotId') snapshotId: string, @Query('contour') _contour: string) {
    await this.snapshots.close(snapshotId);
  }
}
