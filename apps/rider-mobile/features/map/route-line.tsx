import { Polyline } from 'react-native-maps';

interface Props {
  coordinates: { latitude: number; longitude: number }[];
}

export function RouteLine({ coordinates }: Props) {
  if (coordinates.length < 2) return null;
  return (
    <Polyline
      coordinates={coordinates}
      strokeColor="#0f766e"
      strokeWidth={4}
    />
  );
}
