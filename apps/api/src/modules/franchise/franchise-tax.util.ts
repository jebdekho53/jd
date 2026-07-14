/**
 * Tax on a franchise commission payout (India).
 *
 * The partner supplies us a service (recruiting and managing merchants), so they
 * raise an invoice on the platform:
 *
 *   invoice value  = franchiseShare + GST      (GST only if they are GST-registered)
 *   TDS u/s 194H   = 5% of franchiseShare      (on the commission value, NOT on GST)
 *   net to bank    = franchiseShare + GST − TDS
 *
 * We withhold the TDS and remit it to the government, which is why it lands in a
 * TDS_PAYABLE liability account rather than simply reducing what we owe.
 */

/** GST on a commission service supply. */
export const FRANCHISE_GST_PERCENT = 18;

/** Income-tax Act s.194H — TDS on commission/brokerage. */
export const FRANCHISE_TDS_PERCENT = 5;

/**
 * Income-tax Act s.206AA — where the payee has not furnished a PAN, TDS must be
 * deducted at 20%, not the ordinary rate. Deducting 5% from someone whose PAN we
 * never verified makes the platform liable for the short deduction.
 */
export const FRANCHISE_TDS_PERCENT_NO_PAN = 20;

export interface FranchiseTaxInput {
  /** The partner's share of the platform commission, before tax. */
  franchiseShare: number;
  /** True only when the partner has a GSTIN on file — unregistered partners charge no GST. */
  gstRegistered: boolean;
  /** True only when a PAN_CARD document has been VERIFIED. Drives 194H vs 206AA. */
  panVerified: boolean;
}

export interface FranchiseTaxBreakdown {
  gstPercent: number;
  gstAmount: number;
  tdsPercent: number;
  tdsAmount: number;
  /** What actually reaches the partner's bank account. */
  netPayable: number;
}

export function computeFranchiseTax(input: FranchiseTaxInput): FranchiseTaxBreakdown {
  const share = round(Math.max(0, input.franchiseShare));

  const gstPercent = input.gstRegistered ? FRANCHISE_GST_PERCENT : 0;
  const gstAmount = round(share * (gstPercent / 100));

  // Deliberately computed on `share`, not on `share + gstAmount`: TDS is deducted
  // on the commission value excluding GST.
  const rate = input.panVerified ? FRANCHISE_TDS_PERCENT : FRANCHISE_TDS_PERCENT_NO_PAN;
  const tdsPercent = share > 0 ? rate : 0;
  const tdsAmount = round(share * (tdsPercent / 100));

  return {
    gstPercent,
    gstAmount,
    tdsPercent,
    tdsAmount,
    netPayable: round(share + gstAmount - tdsAmount),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
