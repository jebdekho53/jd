/**
 * Razorpay Route transfer webhook events, re-broadcast on the internal event bus.
 *
 * A Route transfer is asynchronous: `createTransfer` returns while the money is
 * still in flight, so both consumers (franchise payouts and merchant settlements)
 * optimistically mark their record paid. Razorpay then confirms the real outcome
 * via `transfer.processed` / `transfer.failed` / `transfer.reversed`. The payment
 * webhook turns those into these events; each consumer listens and reconciles its
 * OWN record by the transfer id, so the payment module stays decoupled from
 * franchise/settlement.
 */
export const RAZORPAY_TRANSFER_EVENTS = {
  PROCESSED: 'razorpay.transfer.processed',
  /** transfer.failed OR transfer.reversed — the money did not reach the recipient. */
  FAILED: 'razorpay.transfer.failed',
} as const;

export interface RazorpayTransferEvent {
  /** Razorpay transfer id (trf_xxx). */
  transferId: string;
  /** Razorpay's own status string, for logging. */
  status: string;
  /** Present on failure/reversal. */
  failureReason?: string | null;
}
