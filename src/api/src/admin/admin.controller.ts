import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { parseOptionalPositiveInteger } from '../shared/id.js';
import { AdminGuard, AdminRequest } from './admin.guard.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Post('auth/login')
  login(@Body() body: unknown, @Req() request: Request) {
    return this.adminService.login(body, request.ip ?? 'unknown');
  }

  @Get('overview')
  @UseGuards(AdminGuard)
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('mapping-issues')
  @UseGuards(AdminGuard)
  listMappingIssues() {
    return this.adminService.listMappingIssues();
  }

  @Patch('studio-sources/:id')
  @UseGuards(AdminGuard)
  updateStudioSource(@Param('id') id: string, @Body() body: unknown, @Req() request: AdminRequest) {
    return this.adminService.updateStudioSource(actor(request), parseId(id), body);
  }

  @Post('studio-sources/:id/verify')
  @UseGuards(AdminGuard)
  verifyStudioSource(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.adminService.verifyStudioSource(actor(request), parseId(id));
  }

  @Patch('room-sources/:id')
  @UseGuards(AdminGuard)
  updateRoomSource(@Param('id') id: string, @Body() body: unknown, @Req() request: AdminRequest) {
    return this.adminService.updateRoomSource(actor(request), parseId(id), body);
  }

  @Post('room-sources/:id/verify')
  @UseGuards(AdminGuard)
  verifyRoomSource(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.adminService.verifyRoomSource(actor(request), parseId(id));
  }

  @Get('image-issues')
  @UseGuards(AdminGuard)
  listImageIssues() {
    return this.adminService.listImageIssues();
  }

  @Patch('studios/:id/image')
  @UseGuards(AdminGuard)
  updateStudioImage(@Param('id') id: string, @Body() body: unknown, @Req() request: AdminRequest) {
    return this.adminService.updateStudioImage(actor(request), parseId(id), body);
  }

  @Patch('studios/:id/status')
  @UseGuards(AdminGuard)
  updateStudioStatus(@Param('id') id: string, @Body() body: unknown, @Req() request: AdminRequest) {
    return this.adminService.updateStudioStatus(actor(request), parseId(id), body);
  }

  @Patch('rooms/:id/status')
  @UseGuards(AdminGuard)
  updateRoomStatus(@Param('id') id: string, @Body() body: unknown, @Req() request: AdminRequest) {
    return this.adminService.updateRoomStatus(actor(request), parseId(id), body);
  }

  @Get('audit-logs')
  @UseGuards(AdminGuard)
  listAuditLogs(@Query('limit') limitQuery?: string) {
    return this.adminService.listAuditLogs(parseOptionalPositiveInteger(limitQuery, 'limit') ?? 50);
  }
}

function parseId(value: string) {
  return parseOptionalPositiveInteger(value, 'id')!;
}

function actor(request: AdminRequest) {
  return request.adminActor ?? 'admin';
}
