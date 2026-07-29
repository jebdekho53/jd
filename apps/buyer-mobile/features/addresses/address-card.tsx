import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { AddressLabel, BuyerAddress } from '@/types/address';

const LABEL_META: Record<AddressLabel, { emoji: string; text: string }> = {
  HOME: { emoji: '🏠', text: 'Home' },
  WORK: { emoji: '💼', text: 'Work' },
  OTHER: { emoji: '📍', text: 'Other' },
};

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  danger: '#dc2626',
};

export function AddressCard({
  address,
  selected,
  onPress,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: BuyerAddress;
  /** Selection affordances are only used by the checkout picker. */
  selected?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}) {
  const meta = LABEL_META[address.label] ?? LABEL_META.OTHER;
  const hasActions = !!(onEdit || onDelete || onSetDefault);

  return (
    <Pressable
      style={[styles.card, address.isDefault && styles.cardDefault, selected && styles.cardSelected]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.head}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>{meta.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.label}>{meta.text}</Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            )}
          </View>
          <Text style={styles.line}>{address.line1}</Text>
          {address.line2 ? <Text style={styles.lineMuted}>{address.line2}</Text> : null}
          {address.landmark ? <Text style={styles.lineSmall}>Near {address.landmark}</Text> : null}
          <Text style={styles.lineSmall}>
            {address.city ? `${address.city}, ` : ''}PIN {address.pincode}
          </Text>
        </View>
        {selected != null && (
          <View style={[styles.radio, selected && styles.radioOn]}>
            {selected && <Text style={styles.radioMark}>●</Text>}
          </View>
        )}
      </View>

      {hasActions && (
        <View style={styles.actions}>
          {onEdit && (
            <Pressable style={styles.action} onPress={onEdit}>
              <Text style={styles.actionPrimary}>Edit</Text>
            </Pressable>
          )}
          {!address.isDefault && onSetDefault && (
            <Pressable style={styles.action} onPress={onSetDefault}>
              <Text style={styles.actionNeutral}>Set default</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable style={styles.action} onPress={onDelete}>
              <Text style={styles.actionDanger}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  cardDefault: { borderColor: '#2E5E4E4d' },
  cardSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  defaultBadge: {
    backgroundColor: '#2E5E4E1a',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primary },
  line: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  lineMuted: { fontSize: 13, color: COLORS.textMuted },
  lineSmall: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: COLORS.primary },
  radioMark: { fontSize: 12, fontWeight: '800', color: COLORS.primary },

  actions: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  action: { paddingHorizontal: 10, paddingVertical: 6 },
  actionPrimary: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  actionNeutral: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  actionDanger: { fontSize: 12, fontWeight: '700', color: COLORS.danger },
});
