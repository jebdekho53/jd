'use client';

import type { MapPickerPosition } from './google-map-picker';

export interface OsmMapPickerProps {
  position: MapPickerPosition;
  onPositionChange: (position: MapPickerPosition) => void;
  className?: string;
  heightClassName?: string;
  disabled?: boolean;
}

export { OsmMapPickerInner as OsmMapPicker } from './osm-map-picker-inner';
