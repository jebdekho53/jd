import { View, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { googleMapsDirectionsUrl } from '@/utils/distance';
import * as Linking from 'expo-linking';

interface Props {
  storeLat: number;
  storeLng: number;
  customerLat: number;
  customerLng: number;
  showStore?: boolean;
  showCustomer?: boolean;
}

async function openMaps(lat: number, lng: number) {
  await Linking.openURL(googleMapsDirectionsUrl(lat, lng));
}

export function NavigationCTA({
  storeLat,
  storeLng,
  customerLat,
  customerLng,
  showStore = true,
  showCustomer = true,
}: Props) {
  return (
    <View style={styles.row}>
      {showStore && (
        <Button
          label="Navigate to store"
          variant="secondary"
          onPress={() => void openMaps(storeLat, storeLng)}
          style={styles.btn}
        />
      )}
      {showCustomer && (
        <Button
          label="Navigate to customer"
          variant="secondary"
          onPress={() => void openMaps(customerLat, customerLng)}
          style={styles.btn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8 },
  btn: { width: '100%' },
});
