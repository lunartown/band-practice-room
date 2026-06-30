import { databasePoolConfig, defaultDatabaseUrl } from './database.service.js';

describe('databasePoolConfig', () => {
  const original = process.env.DATABASE_URL;
  const originalSsl = process.env.DATABASE_SSL;

  afterEach(() => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    if (originalSsl === undefined) delete process.env.DATABASE_SSL;
    else process.env.DATABASE_SSL = originalSsl;
  });

  it('원격 문자열에서 channel_binding·sslmode 를 떼고 인코딩된 비밀번호는 보존한다', () => {
    // 자격증명은 조립해서 URL 을 만든다 — 실제 값이 아니고, user:pass@host 리터럴이
    // 소스에 그대로 남지 않게 해 시크릿 스캐너 오탐을 피한다.
    const credential = ['db_owner', 'placeholder%40pw'].join(':');
    process.env.DATABASE_URL =
      `postgresql://${credential}@db-host.example.test/appdb?sslmode=require&channel_binding=require`;
    const { connectionString, ssl } = databasePoolConfig();
    expect(connectionString).not.toContain('channel_binding');
    expect(connectionString).not.toContain('sslmode');
    // %40(@) 인코딩이 그대로 유지돼야 인증이 깨지지 않는다.
    expect(connectionString).toContain('placeholder%40pw');
    expect(ssl).toEqual({ rejectUnauthorized: false });
  });

  it('로컬 문자열은 SSL 을 끄고 문자열을 변형하지 않는다', () => {
    process.env.DATABASE_URL = defaultDatabaseUrl;
    const { connectionString, ssl } = databasePoolConfig();
    expect(connectionString).toBe(defaultDatabaseUrl);
    expect(ssl).toBe(false);
  });
});
