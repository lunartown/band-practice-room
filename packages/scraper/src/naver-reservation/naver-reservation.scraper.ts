import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { parseAvailabilitySlots } from './naver-reservation.parser.js';
import type { PageSnapshot, ScrapeResult, ScrapeTarget } from './types.js';

const mobileUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

export type NaverReservationScraperOptions = {
  headless?: boolean;
  debug?: boolean;
};

export class NaverReservationScraper {
  private readonly headless: boolean;
  private readonly debug: boolean;

  constructor(options: NaverReservationScraperOptions = {}) {
    this.headless = options.headless ?? true;
    this.debug = options.debug ?? false;
  }

  async scrape(target: ScrapeTarget, date: string, roomNames: string[]): Promise<ScrapeResult> {
    const browser = await chromium.launch({ headless: this.headless });

    try {
      const context = await this.createContext(browser);
      const snapshots: PageSnapshot[] = [];
      const rooms = [];

      for (const roomName of roomNames) {
        const page = await context.newPage();
        page.setDefaultTimeout(20_000);

        try {
          const snapshot = await this.scrapeRoom(page, target.sourceUrl, date, roomName);
          const slots = parseAvailabilitySlots(snapshot);
          snapshots.push(snapshot);
          rooms.push({
            name: roomName,
            availableSlots: slots.filter((slot) => slot.status === 'available'),
          });
        } finally {
          await page.close();
        }
      }

      return {
        practiceRoomName: target.name,
        sourceUrl: target.sourceUrl,
        date,
        rooms,
        ...(this.debug ? { debug: { snapshots } } : {}),
      };
    } finally {
      await browser.close();
    }
  }

  private async createContext(browser: Browser): Promise<BrowserContext> {
    return browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 390, height: 844 },
      userAgent: mobileUserAgent,
    });
  }

  private async scrapeRoom(
    page: Page,
    sourceUrl: string,
    targetDate: string,
    roomName: string,
  ): Promise<PageSnapshot> {
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);

    const clicked = await this.clickIfVisible(page, roomName);
    if (!clicked) {
      throw new Error(`Room not found: ${roomName}`);
    }

    await this.selectDate(page, targetDate);
    return this.collectSnapshot(page, targetDate, roomName);
  }

  private async clickIfVisible(page: Page, label: string) {
    const locator = page.getByText(label, { exact: true }).first();
    if ((await locator.count()) === 0) {
      return false;
    }

    await locator.click();
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
    return true;
  }

  private async selectDate(page: Page, date: string) {
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
          .map((element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .slice(0, 80),
      );
  }

  private async collectLinks(page: Page): Promise<Array<{ text: string; href: string | null }>> {
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

  private async collectTimeControls(page: Page): Promise<PageSnapshot['timeControls']> {
    return page.locator('button, a, [role="button"], input').evaluateAll((elements) =>
      elements
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const text = (
            htmlElement.innerText ||
            htmlElement.textContent ||
            htmlElement.getAttribute('value') ||
            ''
          )
            .replace(/\s+/g, ' ')
            .trim();
          const parentText = (
            htmlElement.parentElement?.innerText ||
            htmlElement.parentElement?.textContent ||
            ''
          )
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
        .filter((control) =>
          /([01]?\d|2[0-3])\s*시|오전|오후|마감/.test(control.text + control.parentText),
        )
        .slice(0, 120),
    );
  }
}

