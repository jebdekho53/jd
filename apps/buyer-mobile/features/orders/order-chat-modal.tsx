import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrderChatQuery, useSendOrderChatMutation } from '@/hooks/use-order-chat';
import type { OrderChatMessage } from '@/types/chat';

export function OrderChatModal({
  visible,
  onClose,
  orderId,
  riderName,
}: {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  riderName: string;
}) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<OrderChatMessage>>(null);
  const { data: messages } = useOrderChatQuery(orderId, visible);
  const send = useSendOrderChatMutation(orderId);

  useEffect(() => {
    if (messages?.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    send.mutate(body);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Chat with {riderName}</Text>
          <Pressable onPress={onClose} accessibilityLabel="Close chat">
            <Ionicons name="close" size={24} color="#0f172a" />
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Say hello — messages here go directly to your rider.</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.senderType === 'BUYER' && styles.bubbleRowRight]}>
              <View style={[styles.bubble, item.senderType === 'BUYER' ? styles.bubbleBuyer : styles.bubbleRider]}>
                <Text style={item.senderType === 'BUYER' ? styles.bubbleTextBuyer : styles.bubbleTextRider}>
                  {item.body}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[styles.sendButton, (!draft.trim() || send.isPending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || send.isPending}
            accessibilityLabel="Send message"
          >
            <Ionicons name="send" size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleBuyer: { backgroundColor: '#2E5E4E' },
  bubbleRider: { backgroundColor: '#f1f5f9' },
  bubbleTextBuyer: { color: '#fff', fontSize: 14 },
  bubbleTextRider: { color: '#0f172a', fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0f172a',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E5E4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
