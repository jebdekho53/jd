export const MAX_RIDER_DOCUMENT_BYTES = 5 * 1024 * 1024;

export function riderOrderActionPath(orderId: string, verb: string) {
  return `/api/rider/orders/${encodeURIComponent(orderId)}/${verb}`;
}

export function riderSupportTicketPath(ticketId?: string, suffix?: string) {
  const base = ticketId
    ? `/api/rider/support/tickets/${encodeURIComponent(ticketId)}`
    : '/api/rider/support/tickets';
  return suffix ? `${base}/${suffix}` : base;
}

export function riderCodSubmitPayload(orderIds: string[], amountDeposited: number, notes?: string) {
  return { orderIds, amountDeposited, notes };
}

export function normalizeLocationPayload(input: {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}) {
  return {
    latitude: input.latitude,
    longitude: input.longitude,
    ...(input.heading !== undefined ? { heading: input.heading } : {}),
    ...(input.speed !== undefined ? { speed: input.speed } : {}),
    ...(input.accuracy !== undefined ? { accuracy: input.accuracy } : {}),
  };
}

export function validateRiderDocumentFile(file: Pick<File, 'name' | 'size' | 'type'>) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    throw new Error('Upload JPG, PNG, WEBP, or PDF documents only.');
  }
  if (file.size > MAX_RIDER_DOCUMENT_BYTES) {
    throw new Error('Document must be 5 MB or smaller.');
  }
  if (!file.name.trim()) {
    throw new Error('Choose a valid document file.');
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  validateRiderDocumentFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this document.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read this document.'));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
