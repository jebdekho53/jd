import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrderClaimEligibilityQuery, useCreateOrderClaimMutation } from '@/hooks/use-claims';

const INSTANT_REFUND_REASONS = new Set(['MISSING_ITEM', 'WRONG_ITEM']);

const REASON_LABELS: Record<string, string> = {
  WRONG_ITEM: 'Wrong item',
  DAMAGED: 'Damaged',
  MISSING_ITEM: 'Missing item',
  QUALITY_ISSUE: 'Quality issue',
  EXPIRED_PRODUCT: 'Expired product',
  PACKAGING_DAMAGED: 'Packaging damaged',
  NOT_AS_DESCRIBED: 'Not as described',
  CUSTOMER_CHANGED_MIND: 'Changed my mind',
  OTHER: 'Other',
};

export function OrderClaimPanel({ orderId }: { orderId: string }) {
  const { data: eligibility } = useOrderClaimEligibilityQuery(orderId);
  const createClaim = useCreateOrderClaimMutation(orderId);
  const [claimType, setClaimType] = useState<'REFUND' | 'REPLACEMENT' | 'RETURN'>('REFUND');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  if (!eligibility) return null;

  const canRefund = eligibility.actions.refund;
  const canReplacement = eligibility.actions.replacement;
  const canReturn = eligibility.actions.return;

  if (!canRefund && !canReplacement && !canReturn) return null;

  const item = eligibility.items[0];
  const reasons = item?.reasons ?? [];
  const mayInstantRefund = claimType === 'REFUND' && INSTANT_REFUND_REASONS.has(reason);

  const handleSubmit = async () => {
    if (!item || !reason) {
      Alert.alert('Select a reason');
      return;
    }
    try {
      const claim = await createClaim.mutateAsync({
        claimType,
        reason,
        reasonNote: note || undefined,
        items: [{ orderItemId: item.orderItemId, quantity: 1 }],
        evidence: photoUrl ? [{ kind: 'PHOTO', url: photoUrl }] : undefined,
      });
      setReason('');
      setNote('');
      setPhotoUrl('');
      Alert.alert(
        claim.autoApprovedByPlatform ? 'Refunded instantly' : 'Claim submitted',
        claim.autoApprovedByPlatform
          ? 'No need to wait for review — your refund is on its way.'
          : 'Sent to the store for review.',
      );
    } catch (err) {
      Alert.alert('Could not submit claim', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Need help?</Text>
      <Text style={styles.subtitle}>Raise a claim for items in this order.</Text>

      <View style={styles.typeRow}>
        {canRefund && (
          <Button
            label="Refund"
            variant={claimType === 'REFUND' ? 'primary' : 'secondary'}
            onPress={() => setClaimType('REFUND')}
            style={styles.typeButton}
          />
        )}
        {canReplacement && (
          <Button
            label="Replacement"
            variant={claimType === 'REPLACEMENT' ? 'primary' : 'secondary'}
            onPress={() => setClaimType('REPLACEMENT')}
            style={styles.typeButton}
          />
        )}
        {canReturn && (
          <Button
            label="Return"
            variant={claimType === 'RETURN' ? 'primary' : 'secondary'}
            onPress={() => setClaimType('RETURN')}
            style={styles.typeButton}
          />
        )}
      </View>

      <Text style={styles.label}>Reason</Text>
      <View style={styles.reasonRow}>
        {reasons.map((r) => (
          <Button
            key={r}
            label={REASON_LABELS[r] ?? r}
            variant={reason === r ? 'primary' : 'secondary'}
            onPress={() => setReason(r)}
            style={styles.reasonButton}
          />
        ))}
      </View>

      {mayInstantRefund && (
        <View style={styles.instantBanner}>
          <Text style={styles.instantText}>
            Eligible for instant refund — refunded right away, no need to wait for store review.
          </Text>
        </View>
      )}

      <Input
        label="Description"
        placeholder="Tell us what happened"
        value={note}
        onChangeText={setNote}
        multiline
        style={styles.textarea}
      />
      <Input
        label="Photo URL (proof)"
        placeholder="https://..."
        value={photoUrl}
        onChangeText={setPhotoUrl}
        autoCapitalize="none"
      />
      <Button
        label={createClaim.isPending ? 'Submitting…' : 'Submit claim'}
        onPress={handleSubmit}
        loading={createClaim.isPending}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 4 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { height: 40, paddingHorizontal: 12 },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonButton: { height: 36, paddingHorizontal: 10 },
  instantBanner: { backgroundColor: '#ecfdf5', borderRadius: 10, padding: 10 },
  instantText: { fontSize: 12, color: '#047857' },
  textarea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
});
