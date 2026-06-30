export interface CheckItem {
  lineNo: number;
  checkNo: string;
  checkDate: string;
  amount: number;
  remarks: string;
}

/**
 * Distributes a total amount into a specific number of checks.
 * Handles rounding remainders by adjusting the final check to ensure the sum matches exactly.
 * Generates spaced check dates starting from the base date.
 */
export function distributeChecks(
  totalAmount: number,
  numberOfChecks: number,
  baseDateStr: string
): CheckItem[] {
  if (numberOfChecks <= 0 || totalAmount <= 0) {
    return [];
  }

  const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();
  const checks: CheckItem[] = [];
  
  // Calculate raw check amount and round to 2 decimal places
  const rawAmount = totalAmount / numberOfChecks;
  const standardAmount = Math.round(rawAmount * 100) / 100;
  
  // Distribute amounts
  let sumDistributed = 0;
  for (let i = 0; i < numberOfChecks; i++) {
    let checkAmount = standardAmount;
    
    // Adjust the last check to absorb any rounding remainders
    if (i === numberOfChecks - 1) {
      checkAmount = Math.round((totalAmount - sumDistributed) * 100) / 100;
    } else {
      sumDistributed += checkAmount;
    }

    // Determine check date (spaced out, e.g., monthly or quarterly)
    // For 4 checks, space by 3 months. For others, space by 12/numberOfChecks months.
    const intervalMonths = numberOfChecks === 4 ? 3 : Math.max(1, Math.floor(12 / numberOfChecks));
    const targetDate = new Date(baseDate);
    targetDate.setMonth(baseDate.getMonth() + i * intervalMonths);
    const dateString = targetDate.toISOString().substring(0, 10);

    checks.push({
      lineNo: i + 1,
      checkNo: `CHK-${String(Math.floor(100000 + Math.random() * 900000))}`,
      checkDate: dateString,
      amount: checkAmount,
      remarks: `Check ${i + 1} of ${numberOfChecks}`
    });
  }

  return checks;
}

/**
 * Calculates outstanding balance and status based on payment details.
 */
export function calculateSettlementStatus(
  invoiceTotal: number,
  lastReceiptTotal: number,
  receiptTotal: number
): { balanceAmount: number; status: string } {
  const balanceAmount = Math.max(0, Math.round((invoiceTotal - lastReceiptTotal - receiptTotal) * 100) / 100);
  
  let status = 'Outstanding';
  if (balanceAmount === 0 && invoiceTotal > 0) {
    status = 'Fully Paid';
  } else if (receiptTotal > 0 || lastReceiptTotal > 0) {
    status = 'Partially Paid';
  }

  return {
    balanceAmount,
    status
  };
}
