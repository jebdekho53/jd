import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AddFoodCartItemPayload, MenuAddonGroup, MenuItem } from '@/types/food';

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

/** A group behaves as a radio when it can only ever hold one selection. */
function isSingleChoice(group: MenuAddonGroup): boolean {
  return group.maxSelections <= 1 || group.selectionType === 'SINGLE';
}

/**
 * Customisation sheet for menu items that carry variants or addon groups.
 * The API validates required/min/max addon selections server-side and rejects
 * the add with a 400, so the same rules are enforced here to keep the buyer
 * out of an unrecoverable error state.
 */
export function MenuItemSheet({
  item,
  visible,
  submitting,
  error,
  onSubmit,
  onClose,
}: {
  item: MenuItem | null;
  visible: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: AddFoodCartItemPayload) => void;
  onClose: () => void;
}) {
  const [variantId, setVariantId] = useState<string | undefined>();
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [touchedItemId, setTouchedItemId] = useState<string | null>(null);

  // Reset the form whenever a different item opens the sheet.
  if (item && touchedItemId !== item.id) {
    setTouchedItemId(item.id);
    setVariantId((item.variants.find((v) => v.isDefault) ?? item.variants[0])?.id);
    setAddonIds([]);
    setQuantity(1);
    setInstructions('');
  }

  const groups = useMemo(
    () => (item?.addonGroups ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((g) => g.group),
    [item],
  );

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    const variant = item.variants.find((v) => v.id === variantId);
    const base = variant ? toNumber(variant.price) : toNumber(item.basePrice);
    const addonTotal = groups
      .flatMap((g) => g.addons)
      .filter((a) => addonIds.includes(a.id))
      .reduce((sum, a) => sum + toNumber(a.price), 0);
    return base + addonTotal;
  }, [item, variantId, addonIds, groups]);

  const validationError = useMemo(() => {
    for (const group of groups) {
      const selected = group.addons.filter((a) => addonIds.includes(a.id)).length;
      if (group.isRequired && selected === 0) return `Choose an option from “${group.name}”`;
      if (selected < group.minSelections) {
        return `Choose at least ${group.minSelections} from “${group.name}”`;
      }
      if (selected > group.maxSelections) {
        return `Choose at most ${group.maxSelections} from “${group.name}”`;
      }
    }
    return null;
  }, [groups, addonIds]);

  const toggleAddon = (group: MenuAddonGroup, addonId: string) => {
    setAddonIds((prev) => {
      const groupAddonIds = group.addons.map((a) => a.id);
      if (isSingleChoice(group)) {
        const withoutGroup = prev.filter((id) => !groupAddonIds.includes(id));
        return prev.includes(addonId) && !group.isRequired ? withoutGroup : [...withoutGroup, addonId];
      }
      if (prev.includes(addonId)) return prev.filter((id) => id !== addonId);
      const selectedInGroup = prev.filter((id) => groupAddonIds.includes(id));
      if (selectedInGroup.length >= group.maxSelections) return prev;
      return [...prev, addonId];
    });
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.title}>{item.name}</Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

            {item.variants.length > 1 && (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>Choose a size</Text>
                {item.variants.map((variant) => (
                  <Option
                    key={variant.id}
                    label={variant.name}
                    price={toNumber(variant.price)}
                    selected={variantId === variant.id}
                    single
                    disabled={variant.availability !== 'AVAILABLE'}
                    onPress={() => setVariantId(variant.id)}
                  />
                ))}
              </View>
            )}

            {groups.map((group) => {
              const selectedInGroup = group.addons.filter((a) => addonIds.includes(a.id)).length;
              return (
                <View key={group.id} style={styles.group}>
                  <Text style={styles.groupTitle}>{group.name}</Text>
                  <Text style={styles.groupHint}>
                    {group.isRequired ? 'Required · ' : 'Optional · '}
                    {isSingleChoice(group)
                      ? 'pick 1'
                      : `pick ${group.minSelections}–${group.maxSelections}`}
                  </Text>
                  {group.addons.map((addon) => {
                    const selected = addonIds.includes(addon.id);
                    const atLimit =
                      !selected && !isSingleChoice(group) && selectedInGroup >= group.maxSelections;
                    return (
                      <Option
                        key={addon.id}
                        label={addon.name}
                        price={toNumber(addon.price)}
                        selected={selected}
                        single={isSingleChoice(group)}
                        disabled={atLimit}
                        onPress={() => toggleAddon(group, addon.id)}
                      />
                    );
                  })}
                </View>
              );
            })}

            <View style={styles.group}>
              <Input
                label="Special instructions (optional)"
                value={instructions}
                onChangeText={setInstructions}
                placeholder="e.g. Less spicy"
              />
            </View>

            <View style={styles.quantityRow}>
              <Text style={styles.groupTitle}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Text style={styles.stepperText}>−</Text>
                </Pressable>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <Pressable style={styles.stepperButton} onPress={() => setQuantity((q) => q + 1)}>
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>

            {(validationError || error) && (
              <Text style={styles.error}>{validationError ?? error}</Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.footerButton} />
            <Button
              label={`Add · ₹${(unitPrice * quantity).toFixed(0)}`}
              loading={submitting}
              disabled={!!validationError}
              style={styles.footerButton}
              onPress={() =>
                onSubmit({
                  menuItemId: item.id,
                  variantId,
                  quantity,
                  addonIds: addonIds.length ? addonIds : undefined,
                  specialInstructions: instructions.trim() || undefined,
                })
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Option({
  label,
  price,
  selected,
  single,
  disabled,
  onPress,
}: {
  label: string;
  price: number;
  selected: boolean;
  single: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.option, disabled && styles.optionDisabled]}
      onPress={disabled ? undefined : onPress}
    >
      <View
        style={[
          single ? styles.radio : styles.checkbox,
          selected && (single ? styles.radioOn : styles.checkboxOn),
        ]}
      >
        {selected && (
          <Text style={single ? styles.radioMark : styles.checkboxMark}>{single ? '●' : '✓'}</Text>
        )}
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
      {price > 0 && <Text style={styles.optionPrice}>+₹{price.toFixed(0)}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#cbd5e1',
    marginTop: 10,
  },
  body: { padding: 20, gap: 18 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  description: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginTop: -12 },
  group: { gap: 8 },
  groupTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  groupHint: { fontSize: 12, color: '#6B7280', marginTop: -4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  optionDisabled: { opacity: 0.4 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: '#2E5E4E' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { borderColor: '#2E5E4E', backgroundColor: '#2E5E4E' },
  radioMark: { fontSize: 11, fontWeight: '800', color: '#2E5E4E' },
  checkboxMark: { fontSize: 12, fontWeight: '800', color: '#fff' },
  optionLabel: { flex: 1, fontSize: 14, color: '#374151' },
  optionPrice: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  stepperButton: { paddingHorizontal: 14, paddingVertical: 8 },
  stepperText: { fontSize: 18, fontWeight: '700', color: '#2E5E4E' },
  quantityValue: { minWidth: 28, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#111827' },
  error: { color: '#dc2626', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerButton: { flex: 1 },
});
