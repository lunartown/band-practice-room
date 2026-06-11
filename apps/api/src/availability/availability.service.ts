import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  getTodayInSeoul,
  NaverReservationScraper,
  type AvailabilitySlot,
  type ScrapeResult,
  type ScrapeTarget,
} from '@band-practice-room/scraper';
import type pg from 'pg';
import { DatabaseService } from '../database/database.service.js';

const defaultTarget: ScrapeTarget = {
  id: 'ground-hongdae-main',
  name: '그라운드합주실 본점',
  sourceUrl: 'https://m.booking.naver.com/booking/10/bizes/1061592',
};

const defaultRoomNames = ['S룸', 'A1', 'A2', 'A3', 'B1', 'B2'];

type GetAvailabilityInput = {
  date?: string;
  roomNames?: string[];
  debug?: boolean;
};

type AvailabilitySlotRow = {
  practice_room_name: string;
  source_url: string;
  room_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: AvailabilitySlot['status'];
};

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async getAvailability(input: GetAvailabilityInput): Promise<ScrapeResult> {
    const date = input.date ?? getTodayInSeoul();
    this.assertDate(date);

    const roomNames = input.roomNames?.length ? input.roomNames : defaultRoomNames;
    const result = await this.database.query<AvailabilitySlotRow>(
      `
        SELECT
          pr.name AS practice_room_name,
          pr.source_url,
          r.name AS room_name,
          s.date::text AS slot_date,
          to_char(s.start_time, 'HH24:MI') AS start_time,
          to_char(s.end_time, 'HH24:MI') AS end_time,
          s.status
        FROM availability_slots s
        JOIN rooms r ON r.id = s.room_id
        JOIN practice_rooms pr ON pr.id = r.practice_room_id
        WHERE pr.id = $1
          AND s.date = $2::date
          AND s.status = 'available'
          AND r.name = ANY($3::text[])
        ORDER BY r.name, s.start_time
      `,
      [defaultTarget.id, date, roomNames],
    );

    return this.toScrapeResult(date, result.rows);
  }

  async scrapeAndStoreAvailability(input: GetAvailabilityInput): Promise<ScrapeResult> {
    const date = input.date ?? getTodayInSeoul();
    this.assertDate(date);

    const roomNames = input.roomNames?.length ? input.roomNames : defaultRoomNames;
    const scraper = new NaverReservationScraper({
      headless: true,
      debug: input.debug ?? false,
    });

    const result = await scraper.scrape(defaultTarget, date, roomNames);
    await this.saveScrapeResult(defaultTarget, result);

    return result;
  }

  private toScrapeResult(date: string, rows: AvailabilitySlotRow[]): ScrapeResult {
    const rooms = new Map<string, AvailabilitySlot[]>();

    for (const row of rows) {
      const slots = rooms.get(row.room_name) ?? [];
      slots.push({
        roomName: row.room_name,
        date: row.slot_date,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
      });
      rooms.set(row.room_name, slots);
    }

    return {
      practiceRoomName: rows[0]?.practice_room_name ?? defaultTarget.name,
      sourceUrl: rows[0]?.source_url ?? defaultTarget.sourceUrl,
      date,
      rooms: Array.from(rooms.entries()).map(([name, availableSlots]) => ({
        name,
        availableSlots,
      })),
    };
  }

  private async saveScrapeResult(target: ScrapeTarget, result: ScrapeResult) {
    await this.database.transaction(async (client) => {
      await this.upsertPracticeRoom(client, target);

      const scrapeRun = await client.query<{ id: string }>(
        `
          INSERT INTO scrape_runs (practice_room_id, target_date, status, started_at)
          VALUES ($1, $2::date, 'success', now())
          RETURNING id
        `,
        [target.id, result.date],
      );

      for (const room of result.rooms) {
        const roomId = this.getRoomId(target.id, room.name);
        await this.upsertRoom(client, target.id, roomId, room.name);
        await client.query(
          `
            DELETE FROM availability_slots
            WHERE room_id = $1
              AND date = $2::date
          `,
          [roomId, result.date],
        );

        for (const slot of room.availableSlots) {
          await client.query(
            `
              INSERT INTO availability_slots (
                room_id,
                date,
                start_time,
                end_time,
                status,
                scraped_at
              )
              VALUES ($1, $2::date, $3::time, $4::time, $5, now())
              ON CONFLICT (room_id, date, start_time, end_time)
              DO UPDATE SET
                status = EXCLUDED.status,
                scraped_at = EXCLUDED.scraped_at
            `,
            [roomId, slot.date, slot.startTime, slot.endTime, slot.status],
          );
        }
      }

      await client.query(
        `
          UPDATE scrape_runs
          SET finished_at = now()
          WHERE id = $1
        `,
        [scrapeRun.rows[0].id],
      );
    });
  }

  private async upsertPracticeRoom(client: pg.PoolClient, target: ScrapeTarget) {
    await client.query(
      `
        INSERT INTO practice_rooms (id, name, area, source_type, source_url, is_active)
        VALUES ($1, $2, $3, 'naver', $4, true)
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          source_url = EXCLUDED.source_url,
          updated_at = now()
      `,
      [target.id, target.name, '홍대', target.sourceUrl],
    );
  }

  private async upsertRoom(
    client: pg.PoolClient,
    practiceRoomId: string,
    roomId: string,
    roomName: string,
  ) {
    await client.query(
      `
        INSERT INTO rooms (id, practice_room_id, name, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          is_active = true,
          updated_at = now()
      `,
      [roomId, practiceRoomId, roomName],
    );
  }

  private getRoomId(practiceRoomId: string, roomName: string) {
    return `${practiceRoomId}:${roomName}`;
  }

  private assertDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must use YYYY-MM-DD format');
    }
  }
}
