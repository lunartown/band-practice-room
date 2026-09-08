import { memo, useEffect, useRef, useState } from 'react';
import type { EquipmentAssignment, Studio } from '../api/types';
import type { AvailabilityChip, RoomAvailability, StudioAvailability } from '../lib/availability';
import { toReviewBadges } from '../lib/reviewKeywords';
import { STUDIO_FALLBACK_IMAGE_URL, galleryImageUrl, thumbnailUrl } from '../lib/imageUrl';
import { useFavorite } from '../lib/useFavorites';
import { toggleFavorite } from '../lib/favorites';
import { shareStudio } from '../lib/share';
import { track } from '../lib/analytics';
import { formatTimeLabel, formatTimeRangeLabel } from '../lib/timeFormat';

interface StudioRowProps {
  studio: StudioAvailability;
  imageRoot: Element | null;
  prioritizeImage?: boolean;
}

// 브라우저의 loading="lazy"는 중첩 스크롤 컨테이너에서 초기 이미지를 누락한
// 적이 있어 사용하지 않는다. 실제 결과 리스트를 root로 직접 관찰해 화면 근처의
// 행만 이미지를 만들고, 한 번 진입한 행은 다시 스크롤 밖으로 나가도 유지한다.
function useNearImageViewport(root: Element | null) {
  const ref = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    if (nearViewport) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setNearViewport(true);
        observer.disconnect();
      },
      { root, rootMargin: '500px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nearViewport, root]);

  return { ref, nearViewport };
}

function chipLabel(chip: AvailabilityChip): string {
  return chip.kind === 'single'
    ? formatTimeLabel(chip.start)
    : formatTimeRangeLabel(chip.start, chip.end);
}

// 예약 가능 시간 = 정보(액션 아님). 중립 회색 칩으로 "슬롯" 단위를 또렷하게 하되,
// 틸(액션) 색은 쓰지 않아 예약 버튼과 확실히 구분한다.
function TimeSlots({ chips }: { chips: AvailabilityChip[] }) {
  return (
    <div className="time-slots">
      {chips.map((chip, i) => (
        <span key={i} className="time-slot">
          {chipLabel(chip)}
        </span>
      ))}
    </div>
  );
}

function PersonIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.5v5l3 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 방 상세 행 전체가 예약 링크라는 점을 우측 셰브론으로 알린다.
function BookChevron() {
  return (
    <svg className="book-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden>
      <path
        d="M12 20.5l-1.45-1.32C5.4 14.5 2 11.42 2 7.65 2 4.6 4.42 2.2 7.5 2.2c1.74 0 3.41.81 4.5 2.1 1.09-1.29 2.76-2.1 4.5-2.1 3.08 0 5.5 2.4 5.5 5.45 0 3.77-3.4 6.85-8.55 11.53L12 20.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StudioAvatar({
  studio,
  loadImage,
}: {
  studio: Pick<Studio, 'imageUrl'>;
  loadImage: boolean;
}) {
  const { imageUrl } = studio;
  const [imgFailed, setImgFailed] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [useOriginal, setUseOriginal] = useState(false);
  const resized = thumbnailUrl(imageUrl);

  useEffect(() => {
    setImgFailed(false);
    setLoadedSrc(null);
    setUseOriginal(false);
  }, [imageUrl]);

  const sourceImgSrc = !useOriginal && resized ? resized : imageUrl ?? null;
  const showSourceImg = loadImage && Boolean(sourceImgSrc) && !imgFailed;
  const showFallback = !showSourceImg || loadedSrc !== sourceImgSrc;

  const handleImgError = () => {
    setLoadedSrc(null);
    if (!useOriginal && resized && resized !== imageUrl) setUseOriginal(true);
    else setImgFailed(true);
  };

  const markLoadedIfComplete = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0) {
      setLoadedSrc(img.getAttribute('src'));
    }
  };

  return (
    <div className={`studio-avatar${showFallback ? ' is-fallback' : ''}`} aria-hidden>
      {showFallback && (
        <span
          className="studio-fallback-image"
          style={{ backgroundImage: `url(${STUDIO_FALLBACK_IMAGE_URL})` }}
        />
      )}
      {showSourceImg && sourceImgSrc ? (
        <img
          ref={markLoadedIfComplete}
          src={sourceImgSrc}
          alt=""
          referrerPolicy="no-referrer"
          style={{ opacity: loadedSrc === sourceImgSrc ? 1 : 0 }}
          onLoad={(event) => setLoadedSrc(event.currentTarget.getAttribute('src'))}
          onError={handleImgError}
        />
      ) : null}
    </div>
  );
}

// 갤러리 사진 한 장. 리사이즈 URL → 실패 시 원본 → 그래도 실패면 숨김(self-healing).
// referrerPolicy="no-referrer" 로 외부 CDN 의 핫링크 보호에 걸리지 않게 한다.
function StudioPhoto({
  url,
  name,
  index,
  total,
  priority,
  onFailure,
}: {
  url: string;
  name: string;
  index: number;
  total: number;
  priority: boolean;
  onFailure: (url: string) => void;
}) {
  const [src, setSrc] = useState(galleryImageUrl(url) ?? url);
  const [triedOriginal, setTriedOriginal] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div
      className="studio-photo"
      role="group"
      aria-roledescription="슬라이드"
      aria-label={`${total}장 중 ${index + 1}번째`}
    >
      <img
        src={src}
        alt={`${name} 사진 ${index + 1}`}
        draggable={false}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onError={() => {
          if (!triedOriginal && src !== url) {
            setTriedOriginal(true);
            setSrc(url);
          } else {
            setFailed(true);
            onFailure(url);
          }
        }}
      />
    </div>
  );
}

// 카드 폭을 채우는 1장 단위 캐러셀. 합주실 로고(imageUrl)와 섞지 않고 실제
// 갤러리 사진(images)만 보여준다. 가로 드래그 직후 상위 예약 링크가 열리지 않게 막는다.
function StudioPhotos({
  images,
  name,
  loadImages,
  prioritizeFirstImage = false,
}: {
  images?: string[];
  name: string;
  loadImages: boolean;
  prioritizeFirstImage?: boolean;
}) {
  const sourceUrls = [...new Set((images ?? []).filter((url): url is string => Boolean(url)))];
  const sourceKey = sourceUrls.join('\n');
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    setFailedUrls(new Set());
    setActiveIndex(0);
  }, [sourceKey]);

  const displayUrls = sourceUrls.filter((url) => !failedUrls.has(url));

  useEffect(() => {
    if (activeIndex >= displayUrls.length) {
      setActiveIndex(Math.max(0, displayUrls.length - 1));
    }
  }, [activeIndex, displayUrls.length]);

  if (displayUrls.length === 0) return null;
  if (!loadImages) return <div className="studio-photo-placeholder" aria-hidden />;

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    const nextIndex = Math.min(
      displayUrls.length - 1,
      Math.max(0, Math.round(scroller.scrollLeft / scroller.clientWidth)),
    );
    setActiveIndex((current) => current === nextIndex ? current : nextIndex);
  };

  return (
    <div
      className="studio-photo-carousel"
      role="region"
      aria-roledescription="캐러셀"
      aria-label={`${name} 사진`}
      onPointerDown={(event) => {
        pointerStartX.current = event.clientX;
        dragged.current = false;
      }}
      onPointerMove={(event) => {
        if (pointerStartX.current != null && Math.abs(event.clientX - pointerStartX.current) > 8) {
          dragged.current = true;
        }
      }}
      onPointerCancel={() => {
        pointerStartX.current = null;
        dragged.current = false;
      }}
      onClickCapture={(event) => {
        if (!dragged.current) return;
        event.preventDefault();
        event.stopPropagation();
        pointerStartX.current = null;
        dragged.current = false;
      }}
    >
      <div className="studio-photos" ref={scrollerRef} onScroll={handleScroll}>
        {displayUrls.map((url, index) => (
          <StudioPhoto
            key={url}
            url={url}
            name={name}
            index={index}
            total={displayUrls.length}
            priority={prioritizeFirstImage && index === 0}
            onFailure={(failedUrl) => setFailedUrls((current) => new Set(current).add(failedUrl))}
          />
        ))}
      </div>
      {displayUrls.length > 1 && (
        <div className="studio-photo-pages" aria-hidden>
          {displayUrls.map((url, index) => (
            <span key={url} className={index === activeIndex ? 'active' : ''} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="18" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.1 10.9l7.8-4.6M8.1 13.1l7.8 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function mergeEquipment(
  sharedEquipment: EquipmentAssignment[],
  roomEquipment: EquipmentAssignment[],
): EquipmentAssignment[] {
  const key = (equipment: EquipmentAssignment) =>
    `${equipment.slug}:${equipment.note ?? ''}:${equipment.quantity ?? ''}`;
  const merged = new Map(sharedEquipment.map((equipment) => [key(equipment), equipment]));
  roomEquipment.forEach((equipment) => merged.set(key(equipment), equipment));
  return [...merged.values()];
}

function EquipmentDetails({ equipment }: { equipment: EquipmentAssignment[] }) {
  if (equipment.length === 0) return null;

  return (
    <div className="room-equipment" aria-label="장비 정보">
      <div className="room-equipment-title">장비</div>
      <dl>
        {equipment.map((item, index) => (
          <div className="room-equipment-item" key={`${item.id}:${item.note ?? ''}:${index}`}>
            <dt>{item.name}</dt>
            <dd>{item.note || (item.quantity ? `${item.quantity}대` : '보유')}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// 방행 전체가 예약 링크. 우측 셰브론으로 행이 통째로 탭 대상임을 알린다.
function RoomRow({
  room,
  sharedEquipment,
  studioId,
  studioName,
}: {
  room: RoomAvailability;
  sharedEquipment: EquipmentAssignment[];
  studioId: number;
  studioName: string;
}) {
  const equipment = mergeEquipment(sharedEquipment, room.room.equipment ?? []);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  return (
    <div className="room-row">
      <a
        className="room-booking-link"
        href={room.bookingUrl ?? '#'}
        target="_blank"
        rel="noreferrer"
        aria-label={`${room.room.name} 예약`}
        onClick={() =>
          track('booking_click', {
            source: 'room',
            studio_id: studioId,
            studio_name: studioName,
            room_id: room.room.id,
            has_url: room.bookingUrl != null,
          })
        }
      >
        <div className="room-info">
          <span className="room-name">{room.room.name}</span>
          {room.capacityLabel && (
            <span className="room-cap">
              <PersonIcon />
              {room.capacityLabel}
            </span>
          )}
          <span className="room-price">{room.priceLabel}</span>
          <BookChevron />
        </div>
        <TimeSlots chips={room.chips} />
      </a>

      {equipment.length > 0 && (
        <button
          type="button"
          className={`room-equipment-toggle${equipmentOpen ? ' open' : ''}`}
          aria-expanded={equipmentOpen}
          onClick={() => setEquipmentOpen((open) => !open)}
        >
          {equipmentOpen ? '장비 접기' : '장비 목록 보기'}
          <span aria-hidden>▾</span>
        </button>
      )}
      {equipmentOpen && <EquipmentDetails equipment={equipment} />}
    </div>
  );
}

function RoomSelector({
  rooms,
  selectedRoomId,
  studioName,
  onSelect,
}: {
  rooms: RoomAvailability[];
  selectedRoomId: number | null;
  studioName: string;
  onSelect: (roomId: number) => void;
}) {
  return (
    <div className="room-selector" role="group" aria-label={`${studioName} 방 선택`}>
      {rooms.map((room) => {
        const selected = room.room.id === selectedRoomId;
        return (
          <button
            key={room.room.id}
            type="button"
            className={`room-selector-card${selected ? ' selected' : ''}`}
            aria-pressed={selected}
            onClick={() => onSelect(room.room.id)}
          >
            <span className="room-selector-name">{room.room.name}</span>
            <span className="room-selector-meta">
              {room.capacityLabel && (
                <span className="room-selector-capacity">
                  <PersonIcon />
                  {room.capacityLabel}
                </span>
              )}
              <span className="room-selector-price">{room.priceLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SelectedStudioEmptyRow({
  studio,
  areaName,
  imageRoot,
  onRemove,
  onCreateAlert,
}: {
  studio: Studio;
  areaName: string;
  imageRoot: Element | null;
  onRemove: (studioId: number) => void;
  onCreateAlert: (studio: Studio) => void;
}) {
  const { id, name, reviewCount, reviewKeywords } = studio;
  const badges = toReviewBadges(reviewKeywords, reviewCount);
  const isFav = useFavorite(id);
  const { ref: rowRef, nearViewport } = useNearImageViewport(imageRoot);
  // 온라인 예약 소스가 없는 합주실: "빈 시간 없음"이 아니라 "전화예약"으로 안내.
  const phoneOnly = studio.hasOnlineBooking === false;

  return (
    <div ref={rowRef} className="studio-row studio-row-empty">
      <div className="studio-main studio-main-static">
        <div className="studio-head">
          <StudioAvatar studio={studio} loadImage={nearViewport} />
          <div className="studio-name-area">
            <div className="studio-name">{name}</div>
            <div className="studio-meta">
              <span className="studio-area">{areaName}</span>
              {reviewCount != null && reviewCount > 0 && (
                <span className="studio-reviews">리뷰 {reviewCount}</span>
              )}
            </div>
          </div>
          <div className={`studio-unavailable-pill${phoneOnly ? ' studio-phone-pill' : ''}`}>
            {phoneOnly ? '📞 전화예약' : '빈 시간 없음'}
          </div>
        </div>

        <StudioPhotos images={studio.images} name={name} loadImages={nearViewport} />

        {badges.length > 0 && (
          <div className="review-badges">
            {badges.map((word) => (
              <span key={word} className="review-badge">
                {word}
              </span>
            ))}
          </div>
        )}

        <div className="studio-empty-message">
          <ClockIcon />
          <div className="studio-empty-copy">
            {phoneOnly ? (
              <>
                <strong>온라인 예약을 지원하지 않는 합주실이에요</strong>
                <span>전화로 예약 가능 여부를 확인해 주세요</span>
              </>
            ) : (
              <>
                <strong>지금은 빈 시간이 없어요</strong>
                <span>빈 시간이 생기면 알려드릴게요</span>
              </>
            )}
          </div>
          {!phoneOnly && (
            <button
              type="button"
              className="inline-alert-button"
              aria-label={`${name} 빈 자리 알림 받기`}
              onClick={() => onCreateAlert(studio)}
            >
              <BellIcon />
              <span>알림</span>
            </button>
          )}
        </div>
      </div>

      <div className="studio-actions">
        <button type="button" className="room-toggle studio-empty-remove" onClick={() => onRemove(id)}>
          선택 해제
        </button>
        <button
          type="button"
          className={`fav-button${isFav ? ' on' : ''}`}
          aria-pressed={isFav}
          aria-label={isFav ? `${name} 즐겨찾기 해제` : `${name} 즐겨찾기`}
          onClick={() => toggleFavorite(id)}
        >
          <HeartIcon filled={isFav} />
        </button>
        <button
          type="button"
          className="share-button"
          aria-label={`${name} 공유`}
          onClick={() => shareStudio(name, null)}
        >
          <ShareIcon />
        </button>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 15.5c-1-1.2-1.5-2.7-1.5-4.7V9.7a4.5 4.5 0 0 0-9 0v1.1c0 2-.5 3.5-1.5 4.7L5 17h14l-1-1.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19.2 5.2v3M17.7 6.7h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export const StudioRow = memo(function StudioRow({ studio, imageRoot, prioritizeImage = false }: StudioRowProps) {
  const { id, name, reviewCount, reviewKeywords } = studio.studio;
  const badges = toReviewBadges(reviewKeywords, reviewCount);
  const isFav = useFavorite(id);
  const { ref: rowRef, nearViewport } = useNearImageViewport(imageRoot);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const selectedRoom = selectedRoomId == null
    ? undefined
    : studio.rooms.find((room) => room.room.id === selectedRoomId);

  useEffect(() => {
    if (selectedRoomId == null) return;
    if (studio.rooms.some((room) => room.room.id === selectedRoomId)) return;
    setSelectedRoomId(null);
  }, [selectedRoomId, studio.rooms]);

  return (
    <div ref={rowRef} className="studio-row">
      {/* 카드 본문(헤더+예약 가능 시간) 전체가 단 하나의 주 액션 = 예약 링크.
          방 선택·방별 링크는 중첩될 수 없으므로 형제로 분리한다. */}
      <a
        className="studio-main"
        href={studio.bookingUrl ?? '#'}
        target="_blank"
        rel="noreferrer"
        aria-label={`${name} 예약`}
        onClick={() =>
          track('booking_click', {
            source: 'studio',
            studio_id: id,
            studio_name: name,
            has_url: studio.bookingUrl != null,
          })
        }
      >
        <div className="studio-head">
          <StudioAvatar studio={studio.studio} loadImage={nearViewport || prioritizeImage} />
          <div className="studio-name-area">
            <div className="studio-name">{name}</div>
            <div className="studio-meta">
              <span className="studio-area">{studio.areaName}</span>
              {reviewCount != null && reviewCount > 0 && (
                <span className="studio-reviews">리뷰 {reviewCount}</span>
              )}
            </div>
          </div>
          <div className="studio-price">{studio.priceLabel}</div>
        </div>

        <StudioPhotos
          images={studio.studio.images}
          name={name}
          loadImages={nearViewport || prioritizeImage}
          prioritizeFirstImage={prioritizeImage}
        />

        {/* 리뷰 배지: 신원(아바타+이름) 헤더 밖, 예약 칩과 같은 게터 라인에 둔다 */}
        {badges.length > 0 && (
          <div className="review-badges">
            {badges.map((word) => (
              <span key={word} className="review-badge">
                {word}
              </span>
            ))}
          </div>
        )}

        {/* 예약 가능 시간 = 정보(액션 아님) */}
        <div className="studio-times">
          <div className="times-label">
            <ClockIcon />
            예약 가능 시간
          </div>
          <TimeSlots chips={studio.chips} />
        </div>
      </a>

      <RoomSelector
        rooms={studio.rooms}
        selectedRoomId={selectedRoomId}
        studioName={name}
        onSelect={(roomId) => {
          setSelectedRoomId(roomId);
          track('room_select', {
            studio_id: id,
            studio_name: name,
            room_id: roomId,
          });
        }}
      />

      {selectedRoom && (
        <div className="room-detail" aria-live="polite">
          <RoomRow
            key={selectedRoom.room.id}
            room={selectedRoom}
            sharedEquipment={studio.studio.equipment ?? []}
            studioId={id}
            studioName={name}
          />
        </div>
      )}

      {/* 즐겨찾기·공유는 방 선택과 분리된 합주실 단위 보조 액션이다. */}
      <div className="studio-actions studio-actions-compact">
        <button
          type="button"
          className={`fav-button${isFav ? ' on' : ''}`}
          aria-pressed={isFav}
          aria-label={isFav ? `${name} 즐겨찾기 해제` : `${name} 즐겨찾기`}
          onClick={() => toggleFavorite(id)}
        >
          <HeartIcon filled={isFav} />
        </button>
        <button
          type="button"
          className="share-button"
          aria-label={`${name} 공유`}
          onClick={() => shareStudio(name, studio.bookingUrl)}
        >
          <ShareIcon />
        </button>
      </div>
    </div>
  );
});
