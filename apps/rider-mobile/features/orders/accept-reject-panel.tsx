import { View, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';

interface Props {
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AcceptRejectPanel({ onAccept, onReject, loading, disabled }: Props) {
  return (
    <View style={styles.row}>
      <Button
        label="Accept"
        onPress={onAccept}
        loading={loading}
        disabled={disabled}
        style={styles.btn}
      />
      <Button
        label="Decline"
        variant="danger"
        onPress={onReject}
        disabled={loading || disabled}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1 },
});
