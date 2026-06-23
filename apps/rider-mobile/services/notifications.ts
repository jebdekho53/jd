import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Delivery orders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function notifyOrderAssigned(orderId: string, orderNumber: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New delivery assigned',
      body: `Order #${orderNumber} is waiting for you`,
      data: { orderId, screen: 'order' },
    },
    trigger: null,
  });
}

export async function notifyOrderCancelled(orderNumber: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Order cancelled',
      body: `Order #${orderNumber} was cancelled`,
      data: { screen: 'orders' },
    },
    trigger: null,
  });
}

export async function notifyDeliveryDelayed(orderNumber: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Delivery delayed',
      body: `Order #${orderNumber} is running behind schedule`,
      data: { screen: 'orders' },
    },
    trigger: null,
  });
}

export function handleNotificationDeepLink(
  response: Notifications.NotificationResponse,
  navigate: (path: string) => void,
) {
  const data = response.notification.request.content.data as {
    orderId?: string;
    screen?: string;
  };
  if (data.orderId) {
    navigate(`/(app)/orders/${data.orderId}`);
  } else if (data.screen === 'orders') {
    navigate('/(app)/orders');
  }
}

export function subscribeNotificationResponses(navigate: (path: string) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((res) => {
    handleNotificationDeepLink(res, navigate);
  });
  return () => sub.remove();
}

export function getDeepLinkFromNotificationUrl(url: string): string | null {
  const parsed = Linking.parse(url);
  const orderId = parsed.queryParams?.orderId;
  if (typeof orderId === 'string') return `/(app)/orders/${orderId}`;
  return null;
}
