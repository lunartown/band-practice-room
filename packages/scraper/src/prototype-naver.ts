import { chromium, type Page } from 'playwright';

const defaultUrl =
  'https://m.booking.naver.com/booking/10/bizes/1061592';

const targetUrl = process.env.NAVER_BOOKING_URL ?? defaultUrl;
const targetDate =
  process.env.TARGET_DATE ??
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
const roomName = process.env.ROOM_NAME ?? 'S룸';
const headless = process.env.HEADLESS !== 'false';
const debug = process.env.DEBUG === 'true';

type AvailabilitySlot = {
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'unavailable' | 'unknown';
};

type TextSnapshot = {
  url: string;
  title: string;
  targetDate: string;
  roomName: string;
  links: Array<{ text: string; href: string | null }>;
  clickableTexts: string[];
  timeControls: Array<{
    text: string;
    tagName: string;
    disabled: boolean;
    ariaDisabled: string | null;
    ariaSelected: string | null;
    className: string;
    parentText: string;
  }>;
  textLines: string[];
  timeLikeLines: string[];
};

type PocResult = {
  practiceRoomName: string;
  sourceUrl: string;
  roomName: string;
  date: string;
  rooms: Array<{
    name: string;
    availableSlots: AvailabilitySlot[];
  }>;
  debug?: TextSnapshot;
};

async function collectClickableTexts(page: Page): Promise<string[]> {
  return page
    .locator('a, button, [role="button"]')
    .evaluateAll((elements) =>
      elements
        .map((element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 80),
    );
}

async function collectLinks(page: Page): Promise<Array<{ text: string; href: string | null }>> {
  return page.locator('a').evaluateAll((elements) =>
    elements
      .map((element) => ({
        text: (element.textContent ?? '').replace(/\s+/g, ' ').trim(),
        href: element.getAttribute('href'),
      }))
      .filter((link) => link.text || link.href)
      .slice(0, 80),
  );
}

async function collectTimeControls(page: Page): Promise<TextSnapshot['timeControls']> {
  return page.locator('button, a, [role="button"], input').evaluateAll((elements) =>
    elements
      .map((element) => {
        const htmlElement = element as HTMLElement;
        const text = (htmlElement.innerText || htmlElement.textContent || htmlElement.getAttribute('value') || '')
          .replace(/\s+/g, ' ')
          .trim();
        const parentText = (htmlElement.parentElement?.innerText || htmlElement.parentElement?.textContent || '')
          .replace(/\s+/g, ' ')
          .trim();

        return {
          text,
          tagName: htmlElement.tagName.toLowerCase(),
          disabled:
            htmlElement.hasAttribute('disabled') ||
            htmlElement.getAttribute('aria-disabled') === 'true',
          ariaDisabled: htmlElement.getAttribute('aria-disabled'),
          ariaSelected: htmlElement.getAttribute('aria-selected'),
          className: htmlElement.className.toString(),
          parentText,
        };
      })
      .filter((control) => /([01]?\d|2[0-3])\s*시|오전|오후|마감/.test(control.text + control.parentText))
      .slice(0, 120),
  );
}

async function collectSnapshot(page: Page): Promise<TextSnapshot> {
  const title = await page.title();
  const bodyText = await page.locator('body').innerText({ timeout: 10_000 });
  const textLines = bodyText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const timeLikeLines = textLines.filter((line) =>
    /([01]?\d|2[0-3])\s*:\s*[0-5]\d|오전|오후|예약|선택|마감|가능|불가/.test(line),
  );

  return {
    url: page.url(),
    title,
    targetDate,
    roomName,
    links: await collectLinks(page),
    clickableTexts: await collectClickableTexts(page),
    timeControls: await collectTimeControls(page),
    textLines,
    timeLikeLines,
  };
}

async function clickIfVisible(page: Page, label: string) {
  const locator = page.getByText(label, { exact: true }).first();
  if ((await locator.count()) === 0) {
    return false;
  }

  await locator.click();
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  return true;
}

async function selectDate(page: Page, date: string) {
  const day = Number(date.slice(8, 10)).toString();
  const dateButton = page
    .locator('button, [role="button"]')
    .filter({ hasText: new RegExp(`^${day}(오늘)?$`) })
    .first();

  if ((await dateButton.count()) === 0) {
    throw new Error(`Target date button not found: ${date}`);
  }

  await dateButton.click();
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(500);
}

function toClockTime(hour: number) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function parseHourLabel(parentText: string, previousHour: number | null): number | null {
  const match = parentText.match(/(?:(오전|오후)\s*)?(\d{1,2})시/);
  if (!match) {
    return null;
  }

  const meridiem = match[1];
  const rawHour = Number(match[2]);

  if (meridiem === '오전') {
    return rawHour === 12 ? 0 : rawHour;
  }

  if (meridiem === '오후') {
    return rawHour === 12 ? 12 : rawHour + 12;
  }

  if (previousHour !== null && previousHour >= 12 && rawHour < 12) {
    return rawHour + 12;
  }

  return rawHour;
}

function parseAvailabilitySlots(snapshot: TextSnapshot): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  let previousHour: number | null = null;

  for (const control of snapshot.timeControls) {
    if (!control.className.includes('btn_time')) {
      continue;
    }

    const hour = parseHourLabel(control.parentText, previousHour);
    if (hour === null) {
      continue;
    }

    previousHour = hour;
    const unavailableByClass = /disabled|disable|soldout|close|unavailable|end/i.test(
      control.className,
    );
    const hasAvailabilityColor = /\bcolor\d+\b/.test(control.className);
    const status =
      control.disabled || unavailableByClass || !hasAvailabilityColor ? 'unavailable' : 'available';

    slots.push({
      roomName: snapshot.roomName,
      date: snapshot.targetDate,
      startTime: toClockTime(hour),
      endTime: toClockTime((hour + 1) % 24),
      status,
    });
  }

  return slots;
}

async function main() {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20_000);

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);

  await clickIfVisible(page, roomName);
  await selectDate(page, targetDate);

  const snapshot = await collectSnapshot(page);
  const slots = parseAvailabilitySlots(snapshot);
  const result: PocResult = {
    practiceRoomName: '그라운드합주실 본점',
    sourceUrl: targetUrl,
    roomName,
    date: targetDate,
    rooms: [
      {
        name: roomName,
        availableSlots: slots.filter((slot) => slot.status === 'available'),
      },
    ],
    ...(debug ? { debug: snapshot } : {}),
  };

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
