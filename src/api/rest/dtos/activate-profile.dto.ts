import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateProfileDto {
  @ApiProperty({ example: 'test-stand' })
  @IsString()
  contour!: string;
}

export class RollbackProfileDto {
  @ApiProperty({ example: 'test-stand' })
  @IsString()
  contour!: string;

  @ApiProperty()
  @IsString()
  versionId!: string;
}
