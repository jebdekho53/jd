import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrawerStore } from '@/store/drawer-store';

export function HamburgerButton() {
  const setOpen = useDrawerStore((s) => s.setOpen);
  return (
    <Pressable onPress={() => setOpen(true)} hitSlop={12} style={styles.button}>
      <Ionicons name="menu" size={24} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 14 },
});
