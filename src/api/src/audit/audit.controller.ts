import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AuditTokenGuard } from './audit-token.guard.js';
import { AuditService } from './audit.service.js';

// GET /api/v1/audit — 읽기 전용 DB 정합성 점검(db-audit)을 서버에서 실행해 JSON 으로 반환.
// 클라우드 루틴이 내부 DB 직결(5432) 대신 이 엔드포인트를 호출한다.
@Controller('audit')
export class AuditController {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(AuditTokenGuard)
  run() {
    return this.auditService.runAudit();
  }
}
