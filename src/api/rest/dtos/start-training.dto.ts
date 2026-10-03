import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileAliasDto {
  @ApiProperty()
  @IsString()
  from!: string;

  @ApiProperty()
  @IsString()
  to!: string;
}

export class StartTrainingDto {
  @ApiProperty({ example: 'test-stand' })
  @IsString()
  contour!: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    example: [{ status: 'NEW', messageType: 'type-a' }],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsObject({ each: true })
  documents!: Record<string, unknown>[];

  @ApiProperty({ example: 50000 })
  @IsInt()
  @Min(1)
  sampleSize!: number;

  @ApiPropertyOptional({ type: [ProfileAliasDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileAliasDto)
  aliases?: ProfileAliasDto[];
}
