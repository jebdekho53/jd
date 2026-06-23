import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, profile } = useAuthStore();
  return (
    <View style={styles.box}>
      <Text style={styles.name}>{profile?.displayName ?? 'Rider'}</Text>
      <Text style={styles.phone}>{user?.phone}</Text>
      {profile && <Badge label={`KYC: ${profile.kycStatus}`} tone={profile.kycStatus === 'APPROVED' ? 'success' : 'warning'} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, padding: 24, backgroundColor: '#f8fafc', gap: 8 },
  name: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  phone: { fontSize: 14, color: '#64748b' },
});
