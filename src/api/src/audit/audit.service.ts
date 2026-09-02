import { Inject, Injectable } from '@nestjs/common';
import { AuditRepository, AuditSectionResult } from './audit.repository.js';

export interface AuditResult {
  generatedAt: string;
  database: string | null;
  serverTime: string | null;
  readOnly: boolean;
  sections: AuditSectionResult[];
}

// db-audit SELECT 진단 결과를 shape 만 담당한다. 판정/요약은 하지 않고
// 원자료만 제공한다(해석은 호출측 db-audit 스킬에 맡김). 쿼리 실행은 repository 소관.
@Injectable()
export class AuditService {
  constructor(@Inject(AuditRepository) private readonly auditRepository: AuditRepository) {}

  async runAudit(): Promise<AuditResult> {
    const collected = await this.auditRepository.collect();
    return {
      generatedAt: new Date().toISOString(),
      readOnly: true,
      database: collected.database,
      serverTime: collected.serverTime,
      sections: collected.sections,
    };
  }
}
