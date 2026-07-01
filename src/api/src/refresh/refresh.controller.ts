import { Body, Controller, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';
import { RefreshService } from './refresh.service.js';

// 입력 payload 보호용 상한. 실제 스크랩 개수 제한은 RefreshService 의 MAX_SOURCES 가 담당한다.
const MAX_STUDIO_IDS = Math.max(
  1,
  Math.floor(Number(process.env.MANUAL_MAX_REQUEST_STUDIO_IDS) || 200),
);

@Controller('slots')
export class RefreshController {
  constructor(@Inject(RefreshService) private readonly refreshService: RefreshService) {}

  // 검색 결과가 오래됐을 때, 화면에 보이는 합주실들의 수집을 즉시(온디맨드) 돌린다.
  @Post('refresh')
  refresh(@Body('studioIds') studioIdsRaw: unknown) {
    const studioIds = parseStudioIds(studioIdsRaw);
    return this.refreshService.refresh(studioIds);
  }
}

function parseStudioIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw new ApiError('INVALID_PARAMETER', 'studioIds must be an array', HttpStatus.BAD_REQUEST);
  }
  const ids = new Set<number>();
  for (const item of value) {
    const n = typeof item === 'number' ? item : Number(item);
    if (!Number.isInteger(n) || n <= 0) {
      throw new ApiError(
        'INVALID_PARAMETER',
        'studioIds must contain positive integers',
        HttpStatus.BAD_REQUEST,
      );
    }
    ids.add(n);
  }
  if (ids.size > MAX_STUDIO_IDS) {
    throw new ApiError(
      'INVALID_PARAMETER',
      `studioIds must contain at most ${MAX_STUDIO_IDS} unique items`,
      HttpStatus.BAD_REQUEST,
    );
  }
  return [...ids];
}
