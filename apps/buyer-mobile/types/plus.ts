export type MembershipBenefitType =
  | 'FREE_DELIVERY'
  | 'PRIORITY_DELIVERY'
  | 'EXTRA_REWARDS'
  | 'VIP_SUPPORT'
  | 'EXCLUSIVE_OFFERS';

export interface MembershipBenefit {
  id: string;
  planId: string;
  type: MembershipBenefitType;
}

export interface MembershipPlan {
  id: string;
  name: string;
  /** Prisma Decimal fields serialize as strings over JSON, not numbers. */
  monthlyPrice: string;
  yearlyPrice: string;
  active: boolean;
  benefits: MembershipBenefit[];
}

export interface MembershipSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
  startedAt: string;
  expiresAt: string;
  plan: MembershipPlan;
}

export interface MemberSavings {
  savings: number;
  usages: number;
  plan?: string;
}

export interface PlusMeResult {
  subscription: MembershipSubscription | null;
  savings: MemberSavings;
}

export const BENEFIT_LABELS: Record<MembershipBenefitType, string> = {
  FREE_DELIVERY: 'Free delivery on every order',
  PRIORITY_DELIVERY: 'Priority delivery slots',
  EXTRA_REWARDS: 'Extra reward points',
  VIP_SUPPORT: 'VIP customer support',
  EXCLUSIVE_OFFERS: 'Exclusive member offers',
};
