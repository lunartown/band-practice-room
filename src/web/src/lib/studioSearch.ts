import type { Area, Slot, Studio } from '../api/types';
import type { DateAvailability } from './availability';

export interface SelectedStudioEmptyItem {
  studio: Studio;
  areaName: string;
}

export interface SelectedStudioChip {
  id: number;
  label: string;
}

export interface StudioSearchStats {
  slotCount: number;
  dayCount: number;
}

export interface StudioSearchSection {
  title: string;
  items: Studio[];
}

export function buildVisibleGroups(
  dateGroups: DateAvailability[],
  selectedStudioIds: number[],
  favOnly: boolean,
  favorites: ReadonlySet<number>,
): DateAvailability[] {
  if (selectedStudioIds.length > 0) {
    const selected = new Set(selectedStudioIds);
    return dateGroups.map((group) => ({
      ...group,
      studios: group.studios.filter((studio) => selected.has(studio.studio.id)),
    }));
  }

  if (!favOnly) return dateGroups;

  return dateGroups.map((group) => ({
    ...group,
    studios: group.studios.filter((studio) => favorites.has(studio.studio.id)),
  }));
}

export function buildAreaChipLabel(areas: Area[], areaIds: number[]) {
  if (areaIds.length === 0) return '전체 지역';
  const selected = areas.filter((area) => areaIds.includes(area.id));
  if (selected.length <= 1) return selected[0]?.name ?? '전체 지역';
  return `${selected[0].name} 외 ${selected.length - 1}`;
}

export function filterStudiosByAreas(studios: Studio[], areaIds: number[]) {
  return studios.filter((studio) => studioMatchesAreas(studio, areaIds));
}

export function buildSelectedStudios(selectedStudioIds: number[], studios: Studio[], slots: Slot[]) {
  return selectedStudioIds
    .map((id) => findStudioById(id, studios, slots))
    .filter((studio): studio is Studio => Boolean(studio));
}

export function buildSelectedStudioChips(
  selectedStudioIds: number[],
  studios: Studio[],
  slots: Slot[],
): SelectedStudioChip[] {
  return selectedStudioIds.map((id) => {
    const studio = findStudioById(id, studios, slots);
    return { id, label: studio?.name ?? `합주실 ${id}` };
  });
}

export function buildSelectedStudioEmptyItems({
  selectedStudios,
  visibleGroups,
  areaNameById,
  preferredAreaIds,
}: {
  selectedStudios: Studio[];
  visibleGroups: DateAvailability[];
  areaNameById: ReadonlyMap<number, string>;
  preferredAreaIds: number[];
}): SelectedStudioEmptyItem[] {
  const visibleStudioIds = collectVisibleStudioIds(visibleGroups);
  return selectedStudios
    .filter((studio) => !visibleStudioIds.has(studio.id))
    .map((studio) => ({
      studio,
      areaName: buildStudioAreaLabel(studio, areaNameById, preferredAreaIds),
    }));
}

export function buildSelectedStudioLabel(studios: Studio[], selectedCount: number) {
  if (selectedCount === 0) return null;
  if (selectedCount === 1) return studios[0]?.name ?? '지정한 합주실';
  return studios[0]?.name ? `${studios[0].name} 외 ${selectedCount - 1}곳` : `${selectedCount}곳`;
}

export function buildStudioSearchStats(groups: DateAvailability[]): Map<number, StudioSearchStats> {
  const stats = new Map<number, StudioSearchStats>();
  for (const group of groups) {
    const seenInDate = new Set<number>();
    for (const item of group.studios) {
      const studioId = item.studio.id;
      const current = stats.get(studioId) ?? { slotCount: 0, dayCount: 0 };
      current.slotCount += item.chips.length;
      if (!seenInDate.has(studioId)) {
        current.dayCount += 1;
        seenInDate.add(studioId);
      }
      stats.set(studioId, current);
    }
  }
  return stats;
}

export function buildStudioSearchSections({
  studios,
  areaNameById,
  areaLabel,
  favorites,
  query,
  recentStudioIds,
}: {
  studios: Studio[];
  areaNameById: ReadonlyMap<number, string>;
  areaLabel: string | null;
  favorites: ReadonlySet<number>;
  query: string;
  recentStudioIds: number[];
}): StudioSearchSection[] {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = studios
    .filter((studio) => {
      if (!normalizedQuery) return true;
      return studioSearchText(studio, areaNameById).includes(normalizedQuery);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  if (normalizedQuery) {
    return matches.length ? [{ title: '검색 결과', items: matches }] : [];
  }

  const sections: StudioSearchSection[] = [];
  const matchById = new Map(matches.map((studio) => [studio.id, studio]));
  const recentItems = recentStudioIds
    .map((studioId) => matchById.get(studioId))
    .filter((studio): studio is Studio => Boolean(studio));
  const recentSet = new Set(recentItems.map((studio) => studio.id));
  if (recentItems.length > 0) {
    sections.push({ title: '최근 선택', items: recentItems });
  }

  const favoriteItems = matches.filter((studio) => favorites.has(studio.id) && !recentSet.has(studio.id));
  if (favoriteItems.length > 0) {
    sections.push({ title: '즐겨찾기', items: favoriteItems });
  }

  const otherItems = matches.filter((studio) => !favorites.has(studio.id) && !recentSet.has(studio.id));
  if (otherItems.length > 0) {
    sections.push({
      title: areaLabel ? `${areaLabel} 합주실` : '전체 합주실',
      items: otherItems,
    });
  }

  return sections;
}

export function buildStudioSearchMeta(
  studio: Studio,
  stats: StudioSearchStats | undefined,
  loading: boolean,
  areaNameById: ReadonlyMap<number, string>,
  preferredAreaIds: number[],
) {
  const area = buildStudioAreaLabel(studio, areaNameById, preferredAreaIds);
  if (loading) return `${area} · 확인 중`;
  if (!stats || stats.slotCount === 0) return `${area} · 현재 조건 빈 시간 없음`;
  const dayLabel = stats.dayCount > 1 ? `${stats.dayCount}일` : '1일';
  return `${area} · 현재 조건 ${dayLabel} ${stats.slotCount}개 구간 가능`;
}

function findStudioById(studioId: number, studios: Studio[], slots: Slot[]) {
  return studios.find((studio) => studio.id === studioId) ??
    slots.find((slot) => slot.studio.id === studioId)?.studio ??
    null;
}

function collectVisibleStudioIds(visibleGroups: DateAvailability[]) {
  const ids = new Set<number>();
  for (const group of visibleGroups) {
    for (const studio of group.studios) ids.add(studio.studio.id);
  }
  return ids;
}

function studioMatchesAreas(studio: Studio, areaIds: number[]) {
  if (areaIds.length === 0) return true;
  const studioAreaIds = getStudioAreaIds(studio);
  return areaIds.some((areaId) => studioAreaIds.includes(areaId));
}

function getStudioAreaIds(studio: Studio) {
  if (studio.areaIds?.length) return studio.areaIds;
  return studio.primaryAreaId == null ? [] : [studio.primaryAreaId];
}

function buildStudioAreaNames(studio: Studio, areaNameById: ReadonlyMap<number, string>) {
  const names: string[] = [];
  const seen = new Set<string>();
  const add = (name: string | null | undefined) => {
    const trimmed = name?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    names.push(trimmed);
    seen.add(trimmed);
  };

  add(studio.primaryAreaName);
  if (studio.primaryAreaId != null) add(areaNameById.get(studio.primaryAreaId));
  getStudioAreaIds(studio).forEach((areaId) => add(areaNameById.get(areaId)));

  return names;
}

function buildStudioAreaLabel(
  studio: Studio,
  areaNameById: ReadonlyMap<number, string>,
  preferredAreaIds: number[],
) {
  const studioAreaIds = getStudioAreaIds(studio);
  const studioAreaSet = new Set(studioAreaIds);
  const preferredNames = preferredAreaIds
    .filter((areaId) => studioAreaSet.has(areaId))
    .map((areaId) => areaNameById.get(areaId))
    .filter((name): name is string => Boolean(name));

  if (preferredNames.length > 0) return compactAreaNames(preferredNames);

  const names = buildStudioAreaNames(studio, areaNameById);
  if (names.length > 0) return compactAreaNames(names);

  return studioAreaIds.length > 0 || studio.primaryAreaId != null ? '지역 확인 중' : '지역 미확인';
}

function compactAreaNames(names: string[]) {
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length === 0) return '지역 미확인';
  if (uniqueNames.length <= 1) return uniqueNames[0];
  return `${uniqueNames[0]} 외 ${uniqueNames.length - 1}`;
}

function studioSearchText(studio: Studio, areaNameById: ReadonlyMap<number, string>) {
  return [
    studio.name,
    ...buildStudioAreaNames(studio, areaNameById),
    studio.address,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
