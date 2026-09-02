import { timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { ApiError } from '../shared/api-error.js';

// 머신-투-머신용 정적 토큰 가드. 클라우드 루틴이 Authorization: Bearer <AUDIT_TOKEN> 로 호출한다.
// admin 은 로그인→세션 토큰 방식이라 무인 루틴에 부적합해 별도 가드를 둔다.
@Injectable()
export class AuditTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configured = process.env.AUDIT_TOKEN;
    if (!configured) {
      throw new ApiError(
        'AUDIT_AUTH_NOT_CONFIGURED',
        'Audit token is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const provided = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (!provided || !safeEqual(provided, configured)) {
      throw new ApiError('UNAUTHORIZED', 'Audit token is required', HttpStatus.UNAUTHORIZED);
    }
    return true;
  }
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}
