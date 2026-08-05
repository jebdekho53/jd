import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderChatMessages, sendOrderChatMessage } from '@/services/buyer-api';
import type { OrderChatMessage } from '@/types/chat';

export const chatKeys = {
  order: (orderId: string) => ['orders', 'chat', orderId] as const,
};

export function useOrderChatQuery(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: chatKeys.order(orderId),
    queryFn: () => getOrderChatMessages(orderId),
    enabled: !!orderId && enabled,
    refetchInterval: enabled ? 4_000 : false,
  });
}

export function useSendOrderChatMutation(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendOrderChatMessage(orderId, body),
    onSuccess: (message) => {
      qc.setQueryData<OrderChatMessage[]>(chatKeys.order(orderId), (prev) =>
        prev ? [...prev, message] : [message],
      );
    },
  });
}
