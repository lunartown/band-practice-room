import { isConfigured, sendPush } from './fcm.js';

// 자격증명이 없는 환경(CI/로컬 기본)에서 FCM 은 dry-run 으로 동작해야 한다.
describe('fcm dry-run (자격증명 미설정)', () => {
  const saved = {
    account: process.env.FCM_SERVICE_ACCOUNT,
    adc: process.env.FCM_USE_ADC,
  };

  beforeAll(() => {
    delete process.env.FCM_SERVICE_ACCOUNT;
    delete process.env.FCM_USE_ADC;
  });

  afterAll(() => {
    if (saved.account !== undefined) process.env.FCM_SERVICE_ACCOUNT = saved.account;
    if (saved.adc !== undefined) process.env.FCM_USE_ADC = saved.adc;
  });

  it('isConfigured() 는 false 다', async () => {
    await expect(isConfigured()).resolves.toBe(false);
  });

  it('sendPush 는 발송 없이 모두 성공으로 돌려준다', async () => {
    const results = await sendPush([
      { token: 'a', title: 't', body: 'b' },
      { token: 'b', title: 't', body: 'b', data: { type: 'slot_available' } },
    ]);
    expect(results).toEqual([
      { token: 'a', success: true, invalidToken: false },
      { token: 'b', success: true, invalidToken: false },
    ]);
  });
});
