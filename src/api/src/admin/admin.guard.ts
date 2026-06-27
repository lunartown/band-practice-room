import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthService } from './admin-auth.service.js';

export interface AdminRequest extends Request {
  adminActor?: string;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(AdminAuthService) private readonly authService: AdminAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const payload = this.authService.verifyAuthorizationHeader(request.headers.authorization);
    request.adminActor = payload.actor;
    return true;
  }
}
