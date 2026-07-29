import { useMemo, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Loader } from '@/components/ui/loader';
import type { RazorpayOrderResult, VerifyPaymentPayload } from '@/types/checkout';

export interface RazorpayWebViewProps {
  order: RazorpayOrderResult | null;
  onSuccess: (payload: Omit<VerifyPaymentPayload, 'checkoutId'>) => void;
  onDismiss: () => void;
  onFailure: (message: string) => void;
}

interface BridgeMessage {
  type: 'success' | 'dismiss' | 'error';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  message?: string;
}

/** Razorpay standard checkout inside a WebView. The page posts the payment
 *  result back over `ReactNativeWebView.postMessage`; the signature is never
 *  trusted here — it is verified server-side by `/payments/razorpay/verify`. */
export function RazorpayWebView({ order, onSuccess, onDismiss, onFailure }: RazorpayWebViewProps) {
  const [loading, setLoading] = useState(true);
  const settled = useRef(false);

  const html = useMemo(() => {
    if (!order) return '';

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      order_id: order.razorpayOrderId,
      name: 'Jebdekho',
      description: `Order ${order.orderNumber}`,
      prefill: {
        name: order.buyerName ?? '',
        contact: order.buyerPhone ?? '',
        email: order.buyerEmail ?? '',
      },
      theme: { color: '#2E5E4E' },
    };

    return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body { margin: 0; height: 100%; background: #ffffff; font-family: -apple-system, system-ui, sans-serif; }
      #status { display: flex; height: 100%; align-items: center; justify-content: center; color: #64748b; }
    </style>
  </head>
  <body>
    <div id="status">Opening secure payment…</div>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      (function () {
        var post = function (payload) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        };

        if (!window.Razorpay) {
          post({ type: 'error', message: 'Payment library failed to load. Check your connection.' });
          return;
        }

        var options = ${JSON.stringify(options)};

        options.handler = function (response) {
          post({
            type: 'success',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
        };

        options.modal = {
          ondismiss: function () { post({ type: 'dismiss' }); },
          escape: false
        };

        try {
          var rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (resp) {
            post({ type: 'error', message: (resp && resp.error && resp.error.description) || 'Payment failed' });
          });
          rzp.open();
        } catch (e) {
          post({ type: 'error', message: String((e && e.message) || e) });
        }
      })();
    </script>
  </body>
</html>`;
  }, [order]);

  const handleMessage = (event: WebViewMessageEvent) => {
    // The bridge can fire more than once (failure then dismiss); honour the first.
    if (settled.current) return;

    let data: BridgeMessage;
    try {
      data = JSON.parse(event.nativeEvent.data) as BridgeMessage;
    } catch {
      return;
    }

    if (data.type === 'success') {
      if (!data.razorpay_order_id || !data.razorpay_payment_id || !data.razorpay_signature) {
        settled.current = true;
        onFailure('Payment response was incomplete. We will reconcile it shortly.');
        return;
      }
      settled.current = true;
      onSuccess({
        razorpayOrderId: data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
      });
      return;
    }

    if (data.type === 'error') {
      settled.current = true;
      onFailure(data.message ?? 'Payment failed');
      return;
    }

    settled.current = true;
    onDismiss();
  };

  return (
    <Modal visible={order !== null} animationType="slide" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              settled.current = true;
              onDismiss();
            }}
            hitSlop={12}
          >
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Secure payment</Text>
          <View style={styles.headerSpacer} />
        </View>

        {order ? (
          <View style={{ flex: 1 }}>
            <WebView
              originWhitelist={['*']}
              source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
              onMessage={handleMessage}
              onLoadEnd={() => setLoading(false)}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              startInLoadingState
            />
            {loading ? (
              <View style={styles.loadingOverlay}>
                <Loader fullScreen label="Opening secure payment…" />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
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
    paddingTop: 50,
    backgroundColor: '#2E5E4E',
  },
  headerAction: { color: '#fff', fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  headerSpacer: { width: 50 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff' },
});
