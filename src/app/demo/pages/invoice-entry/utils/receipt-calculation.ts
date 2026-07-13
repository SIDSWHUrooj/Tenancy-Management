// ── Types ──────────────────────────────────────────────────────

export type RowType = 'admin' | 'deposit' | 'additional' | 'check';

export interface CheckItem {
  id?: number;
  chequeHeaderId?: number;
  lineNo: number;
  checkNo: string;
  checkDate: string;
  amount: number;
  remarks: string;
  bank: string;
  rowType: 'check';
}

/** A single line in the unified, continuously-numbered payment schedule. */
export interface ScheduleRow {
  lineNo: number;
  rowType: RowType;
  description: string;
  bank: string;
  referenceNo: string;
  date: string;
  amount: number;
  /** Only cheque amounts are editable; fixed-charge rows come from the backend. */
  editable: boolean;
  checkLineNo?: number;
}

export interface ScheduleInput {
  adminFeeTotal: number;
  adminFeeReference: string;
  depositTotal: number;
  depositReference: string;
  additionalCharges: { cause: string; total: number; referenceNo?: string }[];
  bank: string;
  periodFrom: string;
  periodTo: string;
  checks: CheckItem[];
}

// ── Helpers ────────────────────────────────────────────────────

/** Fallback interval table used only when the rental period can't be parsed. */
const FALLBACK_INTERVAL_MONTHS: Record<number, number> = {
  1: 12,
  2: 6,
  3: 4,
  4: 3,
  6: 2,
  12: 1,
};

export function generateReference(prefix: string): string {
  return `${prefix}-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

// ── Cheque generation ─────────────────────────────────────────

/**
 * Auto-generates cheque rows for the rent, spread evenly across the
 * rental period (Period From → Period To).
 *
 * IMPORTANT: `totalRentAmount` must be the TAX-INCLUSIVE rent figure
 * (base rent + VAT/tax on rent) — matching how Admin Fee, Deposit, and
 * Penalty are already passed as "*Total" values. Passing the pre-tax
 * base rent here will under-distribute the cheque amounts.
 *
 * - Amount per cheque = totalRentAmount ÷ Number of Cheques (last cheque
 *   absorbs any rounding remainder so the sum always equals totalRentAmount
 *   exactly).
 * - Dates are evenly distributed: interval = total rental months ÷ number of
 *   cheques (e.g. 12 months / 4 cheques = every 3 months). If the period is
 *   missing or zero-length, falls back to the standard 1/2/3/4/6/12 table.
 * - Cheque dates are NEVER entered manually — this is the single source of
 *   truth for cheque dates.
 */
export function distributeChecks(
  totalRentAmount: number,
  numberOfChecks: number,
  periodFrom: string,
  periodTo: string,
  bank: string = ''
): CheckItem[] {
  if (numberOfChecks <= 0 || totalRentAmount <= 0) return [];

  const fromDate = periodFrom ? new Date(periodFrom) : new Date();
  const toDate = periodTo ? new Date(periodTo) : new Date();

  const totalMonths = monthsBetween(fromDate, toDate);
  const intervalMonths =
    totalMonths > 0
      ? Math.max(1, Math.round(totalMonths / numberOfChecks))
      : (FALLBACK_INTERVAL_MONTHS[numberOfChecks] ?? Math.max(1, Math.floor(12 / numberOfChecks)));

  const standardAmount = Math.round((totalRentAmount / numberOfChecks) * 100) / 100;

  let sumDistributed = 0;
  const checks: CheckItem[] = [];

  for (let i = 0; i < numberOfChecks; i++) {
    let checkAmount = standardAmount;
    if (i === numberOfChecks - 1) {
      checkAmount = Math.round((totalRentAmount - sumDistributed) * 100) / 100;
    } else {
      sumDistributed += checkAmount;
    }

    const targetDate = new Date(fromDate);
    targetDate.setMonth(fromDate.getMonth() + i * intervalMonths);
    const dateString = targetDate.toISOString().substring(0, 10);

    checks.push({
      lineNo: i + 1,
      checkNo: '',
      checkDate: dateString,
      amount: checkAmount,
      remarks: `Cheque ${i + 1} of ${numberOfChecks}`,
      bank,
      rowType: 'check',
    });
  }

  return checks;
}

// ── Unified schedule builder ─────────────────────────────────

/**
 * Builds the single, continuously-numbered financial schedule:
 * 1. Administration Fee   (adminFeeTotal — tax-inclusive)
 * 2. Security Deposit      (depositTotal — tax-inclusive)
 * 3. Additional Charge     (penaltyTotal — tax-inclusive, only if a cause is set)
 * 4..N Cheque rows         (each amount already tax-inclusive, see distributeChecks)
 *
 * Serial numbers run continuously across all rows — cheque numbering never
 * restarts. Every row carries the same bank, a reference/cheque number, and
 * a date, so the table renders as one consistent schedule.
 */
export function buildScheduleRows(input: ScheduleInput): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let sr = 1;

  rows.push({
    lineNo: sr++,
    rowType: 'admin',
    description: 'Administration Fee',
    bank: input.bank,
    referenceNo: input.adminFeeReference || generateReference('REF-ADM'),
    date: input.periodFrom,
    amount: input.adminFeeTotal,
    editable: false,
  });

  rows.push({
    lineNo: sr++,
    rowType: 'deposit',
    description: 'Security Deposit',
    bank: input.bank,
    referenceNo: input.depositReference || generateReference('REF-DEP'),
    date: input.periodFrom,
    amount: input.depositTotal,
    editable: false,
  });

  (input.additionalCharges || []).forEach((ac, idx) => {
    rows.push({
      lineNo: sr++,
      rowType: 'additional',
      description: `Additional Charge – ${ac.cause}`,
      bank: input.bank,
      referenceNo: ac.referenceNo || generateReference('REF-ADD'),
      date: input.periodTo,
      amount: ac.total,
      editable: false,
    });
  });

  input.checks.forEach((c) => {
    rows.push({
      lineNo: sr++,
      rowType: 'check',
      description: `Cheque ${c.lineNo}`,
      bank: c.bank || input.bank,
      referenceNo: c.checkNo,
      date: c.checkDate,
      amount: c.amount,
      editable: true,
      checkLineNo: c.lineNo,
    });
  });

  return rows;
}

// ── Settlement status ────────────────────────────────────────

export function calculateSettlementStatus(
  invoiceTotal: number,
  lastReceiptTotal: number,
  receiptTotal: number
): { balanceAmount: number; status: string } {
  const balanceAmount = Math.max(
    0,
    Math.round((invoiceTotal - lastReceiptTotal - receiptTotal) * 100) / 100
  );

  let status = 'Outstanding';
  if (balanceAmount === 0 && invoiceTotal > 0) {
    status = 'Fully Paid';
  } else if (receiptTotal > 0 || lastReceiptTotal > 0) {
    status = 'Partially Paid';
  }

  return { balanceAmount, status };
}