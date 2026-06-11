export type AvailabilityStatus = 'available' | 'unavailable' | 'unknown';

export type ScrapeTarget = {
  id: string;
  name: string;
  sourceUrl: string;
};

export type AvailabilitySlot = {
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
};

export type TimeControlSnapshot = {
  text: string;
  tagName: string;
  disabled: boolean;
  ariaDisabled: string | null;
  ariaSelected: string | null;
  className: string;
  parentText: string;
};

export type PageSnapshot = {
  url: string;
  title: string;
  targetDate: string;
  roomName: string;
  links: Array<{ text: string; href: string | null }>;
  clickableTexts: string[];
  timeControls: TimeControlSnapshot[];
  textLines: string[];
  timeLikeLines: string[];
};

export type RoomAvailability = {
  name: string;
  availableSlots: AvailabilitySlot[];
};

export type ScrapeResult = {
  practiceRoomName: string;
  sourceUrl: string;
  date: string;
  rooms: RoomAvailability[];
  debug?: {
    snapshots: PageSnapshot[];
  };
};

