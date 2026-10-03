import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldConstraintDto {
  @ApiProperty({ example: 'status' })
  @IsString()
  path!: string;

  @ApiProperty({ enum: ['boolean', 'category', 'datetime'] })
  @IsIn(['boolean', 'category', 'datetime'])
  kind!: 'boolean' | 'category' | 'datetime';

  @ApiProperty({ type: [String], example: ['NEW'] })
  @IsArray()
  values!: Array<string | boolean>;
}

export class CreateJobDto {
  @ApiProperty({ example: 'document' })
  @IsString()
  documentType!: string;

  @ApiProperty({ example: 'test-stand' })
  @IsString()
  contour!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileVersionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiProperty({ example: 'stand-24' })
  @IsString()
  seed!: string;

  @ApiProperty({ example: 10000 })
  @IsInt()
  @Min(1)
  count!: number;

  @ApiProperty({ example: 'documents-synthetic' })
  @IsString()
  targetIndex!: string;

  @ApiProperty({ example: '2026-09-24T21:00:00+03:00' })
  @IsString()
  generatedAt!: string;

  @ApiPropertyOptional({ type: [FieldConstraintDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldConstraintDto)
  fieldConstraints?: FieldConstraintDto[];

  @ApiPropertyOptional({ type: [String], example: ['hits.hits'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  arrayPaths?: string[];
}
