import { DeliveryProviderType } from '@prisma/client';

export class LogisticsProviderError extends Error {
  readonly providerStatusCode?: number;
  readonly providerMessage?: string;

  constructor(
    message: string,
    readonly providerType: DeliveryProviderType,
    readonly code?: string,
    readonly retryable = false,
    readonly cause?: unknown,
    opts?: { providerStatusCode?: number; providerMessage?: string },
  ) {
    super(message);
    this.name = 'LogisticsProviderError';
    this.providerStatusCode = opts?.providerStatusCode;
    this.providerMessage = opts?.providerMessage;
  }
}

export class ProviderNotEnabledError extends LogisticsProviderError {
  constructor(providerType: DeliveryProviderType) {
    super(`Provider ${providerType} is not enabled`, providerType, 'PROVIDER_NOT_ENABLED', false);
    this.name = 'ProviderNotEnabledError';
  }
}

export class ProviderNotImplementedError extends LogisticsProviderError {
  constructor(providerType: DeliveryProviderType) {
    super(`Provider ${providerType} is not implemented yet`, providerType, 'NOT_IMPLEMENTED', false);
    this.name = 'ProviderNotImplementedError';
  }
}
