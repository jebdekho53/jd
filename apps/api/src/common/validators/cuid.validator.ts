import { Matches, type ValidationOptions } from 'class-validator';

export const CUID_REGEX = /^c[a-z0-9]{24}$/;

export function IsCuid(validationOptions?: ValidationOptions): PropertyDecorator {
  return Matches(CUID_REGEX, {
    message: '$property must be a valid CUID',
    ...validationOptions,
  });
}
