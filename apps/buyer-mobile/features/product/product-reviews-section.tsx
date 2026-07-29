import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Image, ScrollView } from 'react-native';
import { useCreateProductReviewMutation, useProductReviewsQuery } from '@/hooks/use-reviews';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  primary: '#2E5E4E',
  star: '#f59e0b',
  starOff: '#cbd5e1',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  danger: '#dc2626',
};

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text
          key={s}
          style={{ fontSize: size, color: s <= Math.round(value) ? COLORS.star : COLORS.starOff }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

/**
 * Ratings & reviews for a product. The API only accepts a review from a buyer
 * with a DELIVERED order containing the product (400 otherwise) and rejects a
 * second review for the same product with a 409 — both surface inline.
 *
 * Photo attachments (supported by the API and by buyer-web) are not offered
 * here yet: they need an image picker native module this app doesn't bundle.
 */
export function ProductReviewsSection({
  productId,
  productName,
  storeName,
  storeRatingAvg,
  storeRatingCount,
}: {
  productId: string;
  productName: string;
  storeName: string;
  storeRatingAvg?: number;
  storeRatingCount?: number;
}) {
  const { data, isLoading } = useProductReviewsQuery(productId);
  const submitReview = useCreateProductReviewMutation(productId);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const aggregate = data?.aggregate;
  const productCount = aggregate?.ratingCount ?? 0;
  const displayRating = productCount > 0 ? aggregate!.ratingAvg : storeRatingAvg;
  const displayCount = productCount > 0 ? productCount : storeRatingCount;
  const hasRating = displayRating != null && displayRating > 0;
  const reviews = data?.reviews ?? [];

  const handleSubmit = () => {
    submitReview.mutate(
      { rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setShowForm(false);
          setComment('');
          setRating(5);
        },
      },
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>Ratings & reviews</Text>
        <Pressable style={styles.writeButton} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.writeButtonText}>💬 Write a review</Text>
        </Pressable>
      </View>

      {hasRating ? (
        <View style={styles.summary}>
          <View style={styles.summaryScore}>
            <Text style={styles.summaryValue}>{displayRating.toFixed(1)}</Text>
            <Stars value={displayRating} />
            {displayCount != null && displayCount > 0 && (
              <Text style={styles.summaryCount}>
                {productCount > 0 ? `${productCount} product reviews` : `${displayCount} store ratings`}
              </Text>
            )}
          </View>
          {productCount === 0 && storeRatingAvg != null && (
            <Text style={styles.summaryNote}>
              No product reviews yet. Store rating for {storeName} is {storeRatingAvg.toFixed(1)}.
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.emptyRating}>
          No ratings yet for {productName}. Order and share your experience.
        </Text>
      )}

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>Rate {productName}</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable
                key={s}
                onPress={() => setRating(s)}
                accessibilityLabel={`${s} star${s > 1 ? 's' : ''}`}
                hitSlop={4}
              >
                <Text style={[styles.formStar, { color: s <= rating ? COLORS.star : COLORS.starOff }]}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.textarea}
            placeholder="Share what you liked (verified buyers only)"
            placeholderTextColor="#94a3b8"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />
          {submitReview.isError && (
            <Text style={styles.error}>{(submitReview.error as Error).message}</Text>
          )}
          <View style={styles.formActions}>
            <Button
              label="Submit review"
              onPress={handleSubmit}
              loading={submitReview.isPending}
              style={styles.formButton}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => setShowForm(false)}
              style={styles.formButton}
            />
          </View>
          <Text style={styles.formHint}>
            Only verified buyers who received this product can review it.
          </Text>
        </View>
      )}

      {isLoading && <Loader />}

      {reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHead}>
            <Stars value={review.rating} size={13} />
            {review.verifiedPurchase && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ VERIFIED PURCHASE</Text>
              </View>
            )}
            <Text style={styles.reviewAuthor}>{review.buyer?.name ?? 'Buyer'}</Text>
          </View>
          {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
          {review.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {review.images.map((url) => (
                <Image key={url} source={{ uri: url }} style={styles.reviewImage} />
              ))}
            </ScrollView>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 20,
    marginTop: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heading: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  writeButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  writeButtonText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  summary: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  summaryScore: { alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 34, fontWeight: '800', color: COLORS.textPrimary },
  summaryCount: { fontSize: 11, color: COLORS.textMuted },
  summaryNote: { flex: 1, minWidth: 180, fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  emptyRating: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  starRow: { flexDirection: 'row', gap: 1 },

  form: {
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#f8fafc',
  },
  formLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  formStar: { fontSize: 28, paddingHorizontal: 2 },
  textarea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  formActions: { flexDirection: 'row', gap: 10 },
  formButton: { flex: 1 },
  formHint: { fontSize: 11, color: COLORS.textMuted },
  error: { fontSize: 13, color: COLORS.danger },

  reviewCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    backgroundColor: '#fff',
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: { fontSize: 9, fontWeight: '800', color: '#065f46' },
  reviewAuthor: { fontSize: 12, color: COLORS.textMuted },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  imageRow: { gap: 8 },
  reviewImage: { width: 56, height: 56, borderRadius: 10 },
});
