import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Layout, Render } from '@nestjs-ssr/react';
import { ConsoleLayout } from '@views/layout';
import { HomePage } from '@frontend/pages/home/views/home-page';
import { GetHomeHandler } from '@use-cases/queries/get-home/get-home.handler';
import { ConsoleSessionGuard } from '../console-session.guard';
import { ConsoleJsonGuard } from '../console-json.guard';

@Controller()
@Layout(ConsoleLayout)
@UseGuards(ConsoleSessionGuard, ConsoleJsonGuard)
export class HomeConsoleController {
  constructor(private readonly getHome: GetHomeHandler) {}

  @Get()
  @Render(HomePage, { jsonApi: false })
  async home(@Query('contour') contour = 'test-stand') {
    return {
      ...(await this.getHome.execute(contour)),
      head: { title: `Пульт — ${contour}` },
    };
  }
}
