import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { AppUpdatesService } from './app-updates.service.js';

@Controller('app-updates')
export class AppUpdatesController {
  constructor(@Inject(AppUpdatesService) private readonly appUpdatesService: AppUpdatesService) {}

  // 네이티브 앱의 업데이터 플러그인이 실행·복귀 때마다 호출한다(capacitor.config 의 updateUrl).
  // 웹뷰 fetch 가 아니라 네이티브 HTTP 요청이라 CORS 와 무관하다.
  @Post()
  @HttpCode(200)
  check(@Body() body: unknown) {
    return this.appUpdatesService.check(body);
  }
}
