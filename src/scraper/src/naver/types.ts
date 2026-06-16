export type AvailabilityStatus = 'available' | 'unavailable' | 'unknown';

export type ScrapeTarget = {
  studioSourceId: string;
  studioName: string;
  url: string;
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

export type RoomScrapeResult = {
  roomName: string;
  slots: AvailabilitySlot[];
  error?: string;
};

export type DateScrapeResult = {
  date: string;
  rooms: RoomScrapeResult[];
  error?: string;
};
