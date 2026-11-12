import { ApiError } from '../shared/api-error.js';
import { AppBundleRow, AppUpdatesRepository } from './app-updates.repository.js';
import { AppUpdatesService } from './app-updates.service.js';

// 레포지토리를 목으로 대체해 업데이터 플러그인에 돌려줄 응답 규칙만 검증한다(DB 비의존).
function makeService(latest: AppBundleRow | null) {
  const findLatestActive = jest.fn().mockResolvedValue(latest);
  const repository = { findLatestActive } as unknown as AppUpdatesRepository;
  return { service: new AppUpdatesService(repository), findLatestActive };
}

function bundle(version: string): AppBundleRow {
  return {
    id: '10',
    app_id: 'com.hapjusil.app',
    native_version: '1.2.0',
    version,
    url: `https://example.com/${version}.zip`,
    checksum: 'a'.repeat(64),
  };
}

// 플러그인이 실제로 보내는 본문의 일부(app_id, version_build, version_name).
function request(versionName: string, versionBuild = '1.2.0') {
  return {
    platform: 'ios',
    device_id: 'device-1',
    app_id: 'com.hapjusil.app',
    version_build: versionBuild,
    version_name: versionName,
    plugin_version: '8.50.1',
  };
}

describe('AppUpdatesService.check', () => {
  it('앱 ID 와 네이티브 버전으로 최신 활성 번들을 찾는다', async () => {
    const { service, findLatestActive } = makeService(bundle('1.2.0-12'));
    await service.check(request('1.2.0'));
    expect(findLatestActive).toHaveBeenCalledWith('com.hapjusil.app', '1.2.0');
  });

  it('내장 번들 기기에 최신 번들을 내려준다', async () => {
    const { service } = makeService(bundle('1.2.0-12'));
    await expect(service.check(request('1.2.0'))).resolves.toEqual({
      version: '1.2.0-12',
      url: 'https://example.com/1.2.0-12.zip',
      checksum: 'a'.repeat(64),
    });
  });

  it('이미 최신 번들이면 업데이트 없음으로 답한다', async () => {
    const { service } = makeService(bundle('1.2.0-12'));
    await expect(service.check(request('1.2.0-12'))).resolves.toMatchObject({
      kind: 'up_to_date',
      version: '1.2.0-12',
    });
  });

  it('최신 활성 번들이 현재보다 오래돼도 다르면 내려준다(롤백)', async () => {
    // 1.2.0-12 를 끄면 1.2.0-11 이 최신 활성이 된다. 12 를 받은 기기는 11 로 내려가야 한다.
    const { service } = makeService(bundle('1.2.0-11'));
    await expect(service.check(request('1.2.0-12'))).resolves.toMatchObject({
      version: '1.2.0-11',
    });
  });

  it('활성 번들이 없고 받은 번들을 쓰는 중이면 내장 번들로 되돌린다', async () => {
    const { service } = makeService(null);
    await expect(service.check(request('1.2.0-12'))).resolves.toEqual({ version: 'builtin' });
  });

  it('활성 번들이 없고 이미 내장 번들이면 업데이트 없음으로 답한다', async () => {
    const { service } = makeService(null);
    await expect(service.check(request('1.2.0'))).resolves.toMatchObject({ kind: 'up_to_date' });
    await expect(service.check(request('builtin'))).resolves.toMatchObject({
      kind: 'up_to_date',
    });
  });

  it('필수 필드가 없으면 400 으로 거절한다', async () => {
    const { service } = makeService(null);
    await expect(service.check({ app_id: 'com.hapjusil.app' })).rejects.toBeInstanceOf(ApiError);
    await expect(service.check(null)).rejects.toBeInstanceOf(ApiError);
  });
});
