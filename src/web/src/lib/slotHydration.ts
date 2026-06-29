import type { RawSlot, Room, Slot, Studio } from '../api/types';

/**
 * studios 카탈로그로 슬롯의 studio·room 메타를 채워 화면용 `Slot` 으로 변환한다.
 *
 * 슬롯 응답에서 합주실·방 메타를 슬롯마다 중복으로 싣지 않도록 분리하는 중이라,
 * 슬롯은 `studioId`·`roomId` 참조만 가질 수 있다. 여기서 카탈로그 맵으로 조인한다.
 *
 * 전환기 호환:
 * - 구버전 백엔드/번들이 studio·room 객체를 그대로 실어 보내면 그걸 폴백으로 쓴다.
 * - studios 가 아직 로드되기 전이면(맵이 비어 있으면) 폴백으로 그대로 보여준다.
 * - 참조 ID 도 폴백 객체도 없어 메타를 못 찾으면 표시에서 제외한다(크래시 방지).
 */
export function hydrateSlots(
  slots: RawSlot[],
  studioById: Map<number, Studio>,
  roomById: Map<number, Room>,
): Slot[] {
  const hydrated: Slot[] = [];
  for (const slot of slots) {
    const studioId = slot.studio?.id ?? slot.studioId;
    const roomId = slot.room?.id ?? slot.roomId;
    const studio = (studioId != null ? studioById.get(studioId) : undefined) ?? slot.studio;
    const room = (roomId != null ? roomById.get(roomId) : undefined) ?? slot.room;
    if (!studio || !room) continue;
    hydrated.push({ ...slot, studio, room });
  }
  return hydrated;
}

/** studios 목록에서 합주실/방 조회용 맵을 만든다. */
export function buildCatalogIndex(studios: Studio[]): {
  studioById: Map<number, Studio>;
  roomById: Map<number, Room>;
} {
  const studioById = new Map<number, Studio>();
  const roomById = new Map<number, Room>();
  for (const studio of studios) {
    studioById.set(studio.id, studio);
    for (const room of studio.rooms ?? []) roomById.set(room.id, room);
  }
  return { studioById, roomById };
}
