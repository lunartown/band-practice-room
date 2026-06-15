import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { parseAvailabilitySlots } from './parser.js';
import type { DateScrapeResult, PageSnapshot, ScrapeTarget } from './types.js';

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

export type NaverScraperOptions = {
  headless?: boolean;
  debug?: boolean;
};

export class NaverReservationScraper {
  private readonly headless: boolean;
  private readonly debug: boolean;

  constructor(options: NaverScraperOptions = {}) {
    this.headless = options.headless ?? true;
    this.debug = options.debug ?? false;
  }

  async scrape(
    target: ScrapeTarget,
    dates: string[],
    roomNames: string[],
  ): Promise<DateScrapeResult[]> {
    const browser = await chromium.launch({ headless: this.headless });
    try {
      const context = await this.createContext(browser);
      const results: DateScrapeResult[] = [];

      for (const date of dates) {
        results.push(await this.scrapeDate(context, target, date, roomNames));
      }

      return results;
    } finally {
      await browser.close();
    }
  }

  private async createContext(browser: Browser): Promise<BrowserContext> {
    return browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 390, height: 844 },
      userAgent: MOBILE_USER_AGENT,
    });
  }

  // 날짜 하나당 페이지 하나를 열고 방 탭을 순서대로 클릭해 재사용한다.
  private async scrapeDate(
    context: BrowserContext,
    target: ScrapeTarget,
    date: string,
    roomNames: string[],
  ): Promise<DateScrapeResult> {
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);

    try {
      await page.goto(target.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
      await this.navigateToMonth(page, date);

      const rooms = [];
      for (const roomName of roomNames) {
        try {
          await this.clickRoomIfPresent(page, roomName);
          await this.selectDate(page, date);
          const snapshot = await this.collectSnapshot(page, date, roomName);
          const slots = parseAvailabilitySlots(snapshot);
          rooms.push({ roomName, slots });

          if (this.debug) {
            console.debug(
              `[naver] ${target.studioName} / ${roomName} / ${date}: ${slots.length}개 슬롯`,
            );
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          rooms.push({ roomName, slots: [], error: message });
          if (this.debug) {
            console.warn(`[naver] ${target.studioName} / ${roomName} / ${date}: ${message}`);
          }
        }
      }

      return { date, rooms };
    } finally {
      await page.close();
    }
  }

  private async navigateToMonth(page: Page, targetDate: string): Promise<void> {
    const targetYearMonth = targetDate.slice(0, 7);

    for (let i = 0; i < 3; i++) {
      const monthText = await page
        .locator('[class*="month"], [class*="calendar"] [class*="title"]')
        .first()
        .textContent({ timeout: 3_000 })
        .catch(() => null);

      if (!monthText) break;

      const match = monthText.match(/(\d{4})[년.\-\s]+(\d{1,2})/);
      if (!match) break;

      const pageYearMonth = `${match[1]}-${match[2].padStart(2, '0')}`;
      if (pageYearMonth >= targetYearMonth) break;

      const nextBtn = page
        .locator('button, [role="button"]')
        .filter({ hasText: /다음|next|›|▶/i })
        .first();

      if ((await nextBtn.count()) === 0) break;

      await nextBtn.click();
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    }
  }

  private async clickRoomIfPresent(page: Page, roomName: string): Promise<void> {
    const locator = page.getByText(roomName, { exact: true }).first();
    if ((await locator.count()) === 0) return;

    await locator.click();
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  }

  private async selectDate(page: Page, date: string): Promise<void> {
    const day = Number(date.slice(8, 10)).toString();
    const dateButton = page
      .locator('button, [role="button"]')
      .filter({ hasText: new RegExp(`^${day}(오늘)?$`) })
      .first();

    if ((await dateButton.count()) === 0) {
      throw new Error(`날짜 버튼을 찾을 수 없습니다: ${date}`);
    }

    await dateButton.click();
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(300);
  }

  private async collectSnapshot(
    page: Page,
    targetDate: string,
    roomName: string,
  ): Promise<PageSnapshot> {
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
      links: await this.collectLinks(page),
      clickableTexts: await this.collectClickableTexts(page),
      timeControls: await this.collectTimeControls(page),
      textLines,
      timeLikeLines,
    };
  }

  private async collectClickableTexts(page: Page): Promise<string[]> {
    return page
      .locator('a, button, [role="button"]')
      .evaluateAll((elements) =>
        elements
          .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .slice(0, 80),
      );
  }

  private async collectLinks(page: Page): Promise<Array<{ text: string; href: string | null }>> {
    return page.locator('a').evaluateAll((elements) =>
      elements
        .map((el) => ({
          text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
          href: el.getAttribute('href'),
        }))
        .filter((link) => link.text || link.href)
        .slice(0, 80),
    );
  }

  private async collectTimeControls(page: Page): Promise<PageSnapshot['timeControls']> {
    return page.locator('button, a, [role="button"], input').evaluateAll((elements) =>
      elements
        .map((el) => {
          const htmlEl = el as HTMLElement;
          const text = (
            htmlEl.innerText ||
            htmlEl.textContent ||
            htmlEl.getAttribute('value') ||
            ''
          )
            .replace(/\s+/g, ' ')
            .trim();
          const parentText = (
            htmlEl.parentElement?.innerText ||
            htmlEl.parentElement?.textContent ||
            ''
          )
            .replace(/\s+/g, ' ')
            .trim();

          return {
            text,
            tagName: htmlEl.tagName.toLowerCase(),
            disabled:
              htmlEl.hasAttribute('disabled') ||
              htmlEl.getAttribute('aria-disabled') === 'true',
            ariaDisabled: htmlEl.getAttribute('aria-disabled'),
            ariaSelected: htmlEl.getAttribute('aria-selected'),
            className: htmlEl.className.toString(),
            parentText,
          };
        })
        .filter((control) =>
          /([01]?\d|2[0-3])\s*시|오전|오후|마감/.test(control.text + control.parentText),
        )
        .slice(0, 120),
    );
  }
}
