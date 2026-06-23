import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export function Loader({ fullScreen, label }: { fullScreen?: boolean; label?: string }) {
  const spinner = <ActivityIndicator size="large" color="#0f766e" />;

  if (fullScreen || label) {
    return (
      <View style={styles.full}>
        {spinner}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    );
  }
  return spinner;
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    gap: 12,
    padding: 24,
  },
  label: { fontSize: 14, color: '#64748b' },
});
