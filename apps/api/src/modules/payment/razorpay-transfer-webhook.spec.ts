import { PaymentService } from './payment.service';
import { RAZORPAY_TRANSFER_EVENTS } from './razorpay-transfer.events';

/**
 * The webhook only turns a Route transfer event into an internal event; the
 * consumers do the reconciliation. This checks the routing + parsing.
 */
function harness() {
  const emit = jest.fn();
  const svc = Object.create(PaymentService.prototype) as PaymentService;
  Object.assign(svc, { events: { emit }, logger: { log: jest.fn(), warn: jest.fn() } });
  // emitTransferOutcome is private; exercise it directly.
  const emitOutcome = (name: string, payload: unknown) =>
    (svc as unknown as { emitTransferOutcome: (n: string, p: unknown) => void }).emitTransferOutcome(
      name,
      payload,
    );
  return { emitOutcome, emit };
}

const payload = (entity: Record<string, unknown>) => ({ transfer: { entity } });

describe('razorpay transfer webhook → internal event', () => {
  it('transfer.processed emits the PROCESSED channel', () => {
    const { emitOutcome, emit } = harness();
    emitOutcome('transfer.processed', payload({ id: 'trf_1', status: 'processed' }));
    expect(emit).toHaveBeenCalledWith(
      RAZORPAY_TRANSFER_EVENTS.PROCESSED,
      expect.objectContaining({ transferId: 'trf_1', status: 'processed' }),
    );
  });

  it('transfer.failed emits the FAILED channel with the error description', () => {
    const { emitOutcome, emit } = harness();
    emitOutcome(
      'transfer.failed',
      payload({ id: 'trf_2', status: 'failed', error: { description: 'insufficient balance' } }),
    );
    expect(emit).toHaveBeenCalledWith(
      RAZORPAY_TRANSFER_EVENTS.FAILED,
      expect.objectContaining({ transferId: 'trf_2', failureReason: 'insufficient balance' }),
    );
  });

  it('transfer.reversed is treated as a failure', () => {
    const { emitOutcome, emit } = harness();
    emitOutcome('transfer.reversed', payload({ id: 'trf_3', status: 'reversed' }));
    expect(emit.mock.calls[0][0]).toBe(RAZORPAY_TRANSFER_EVENTS.FAILED);
  });

  it('ignores a payload with no transfer id rather than emitting garbage', () => {
    const { emitOutcome, emit } = harness();
    emitOutcome('transfer.processed', payload({ status: 'processed' }));
    expect(emit).not.toHaveBeenCalled();
  });
});
