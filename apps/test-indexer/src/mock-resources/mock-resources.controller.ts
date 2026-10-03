import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  Allow,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import type { ValidatorConstraintInterface } from 'class-validator';
import { ValidatorConstraint } from 'class-validator';
import { ServiceAuthGuard } from '../auth/service-auth.guard';
import { MockResourcesService } from './mock-resources.service';

@ValidatorConstraint({ name: 'jsonObjectOrArray', async: false })
class JsonObjectOrArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      Array.isArray(value) || (typeof value === 'object' && value !== null)
    );
  }
}

class CatalogDto {
  @IsString()
  @IsNotEmpty()
  method!: string;

  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsString()
  @IsNotEmpty()
  group!: string;

  @IsOptional()
  @IsString()
  summary?: string;
}

class BodyDto {
  @IsString()
  @IsNotEmpty()
  method!: string;

  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @Allow()
  @Validate(JsonObjectOrArrayConstraint)
  body!: unknown;
}

class GroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

const asValidation = (error: unknown): never => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status: number }).status === 400
  ) {
    throw new BadRequestException({
      reason: 'validation_error',
      message: 'path',
    });
  }
  throw error;
};

@Controller('internal/v1/mock-resources')
@UseGuards(ServiceAuthGuard)
export class MockResourcesController {
  constructor(private readonly resources: MockResourcesService) {}

  @Get()
  async list() {
    return { resources: await this.resources.list() };
  }

  @Get('groups')
  async groups() {
    return { groups: await this.resources.listGroups() };
  }

  @Put('groups')
  async addGroup(@Body() body: GroupDto) {
    try {
      await this.resources.addGroup(body.name);
      return { name: body.name };
    } catch (error) {
      asValidation(error);
    }
  }

  @Delete('groups')
  async removeGroup(@Query('name') name = '') {
    await this.resources.removeGroup(name);
    return { ok: true };
  }

  @Put('body')
  async putBody(@Body() body: BodyDto) {
    try {
      return await this.resources.putBody(body);
    } catch (error) {
      asValidation(error);
    }
  }

  @Put()
  async put(@Body() body: CatalogDto) {
    try {
      return await this.resources.upsertCatalog({
        method: body.method,
        path: body.path,
        group: body.group,
        summary: body.summary ?? '',
      });
    } catch (error) {
      asValidation(error);
    }
  }

  @Delete()
  async remove(@Query('method') method = '', @Query('path') path = '') {
    await this.resources.remove(method, path);
    return { ok: true };
  }
}
