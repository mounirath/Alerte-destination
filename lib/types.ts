import type { LatLng } from './geo';

export type Destination = LatLng & {
  name: string;
  address?: string;
};

export type SavedPlace = Destination & {
  id: string;
  savedAt: number;
};

export type TrackingStatus = 'idle' | 'tracking' | 'alerting';
