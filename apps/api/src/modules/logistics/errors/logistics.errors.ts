import { DeliveryProviderType } from '@prisma/client';

export class LogisticsProviderError extends Error {
  constructor(
    message: string,
    readonly providerType: DeliveryProviderType,
    readonly code?: string,
    readonly retryable = false,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LogisticsProviderError';
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
