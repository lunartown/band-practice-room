import { Body, Controller, Delete, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { parseOptionalPositiveInteger } from '../shared/id.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService) private readonly notificationsService: NotificationsService,
  ) {}

  // 앱이 부팅 시 FCM 토큰을 여기로 올린다(등록/갱신 겸용).
  @Post('devices')
  registerDevice(@Body() body: unknown) {
    return this.notificationsService.registerDevice(body);
  }

  @Post('subscriptions')
  createSubscription(@Body() body: unknown) {
    return this.notificationsService.createSubscription(body);
  }

  // 로그인이 없으므로 디바이스 토큰을 쿼리로 받아 본인 구독만 돌려준다.
  @Get('subscriptions')
  listSubscriptions(@Query('deviceToken') deviceToken?: string) {
    return this.notificationsService.listSubscriptions(deviceToken);
  }

  @Delete('subscriptions/:id')
  deleteSubscription(@Param('id') id: string, @Body() body: unknown) {
    return this.notificationsService.deleteSubscription(
      parseOptionalPositiveInteger(id, 'id')!,
      body,
    );
  }
}
