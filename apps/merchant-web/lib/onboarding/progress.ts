export const ONBOARDING_STEPS = [
  'PERSONAL_DETAILS',
  'BUSINESS_DETAILS',
  'STORE_DETAILS',
  'DOCUMENTS',
  'BANK_DETAILS',
  'REVIEW',
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number];

/** Visual wizard has 9 steps (0–8); API tracks 6 completion keys. */
export const WIZARD_STEP_COUNT = 9;

export function computeOnboardingProgress(completedSteps: string[]): number {
  if (!completedSteps.length) return 0;
  const done = ONBOARDING_STEPS.filter((s) => completedSteps.includes(s)).length;
  return Math.round((done / ONBOARDING_STEPS.length) * 100);
}

export function computeWizardProgress(currentStep: number): number {
  if (currentStep <= 0) return 0;
  return Math.round((currentStep / (WIZARD_STEP_COUNT - 1)) * 100);
}
