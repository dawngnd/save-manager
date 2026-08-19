import { LoanInputs, MortgageResult, PaymentScheduleItem, YearlySummaryItem } from '../types';

export function calculateMortgage(inputs: LoanInputs): MortgageResult {
  const totalMonths = inputs.tenureYears * 12;
  const effectiveMonths = Math.min(inputs.earlySettlementMonth, totalMonths);
  
  if (inputs.gracePeriodMonths >= effectiveMonths) {
    throw new Error("Grace period cannot exceed loan tenure");
  }
  
  const monthlySchedule: PaymentScheduleItem[] = [];
  let remainingBalance = inputs.loanAmount;
  let totalInterest = 0;
  let totalPayment = 0;
  
  let rateCliffPaymentBefore = 0;
  let rateCliffPaymentAfter = 0;
  
  for (let month = 1; month <= effectiveMonths; month++) {
    const isPromo = month <= inputs.promoMonths;
    const currentRate = isPromo ? inputs.promoRate : inputs.floatingRate;
    
    const interestPaid = Math.round(remainingBalance * (currentRate / 100 / 12));
    let principalPaid = 0;
    
    if (month > inputs.gracePeriodMonths) {
      if (inputs.repaymentMethod === 'reducing_balance') {
        if (month === effectiveMonths) {
          principalPaid = remainingBalance;
        } else {
          principalPaid = Math.round(inputs.loanAmount / (totalMonths - inputs.gracePeriodMonths));
        }
      } else { // annuity
        if (month === effectiveMonths) {
          principalPaid = remainingBalance;
        } else {
          const remainingMonths = totalMonths - month + 1;
          if (currentRate === 0) {
            principalPaid = Math.round(remainingBalance / remainingMonths);
          } else {
            const r = currentRate / 100 / 12;
            const pmt = Math.round((remainingBalance * r * Math.pow(1 + r, remainingMonths)) / (Math.pow(1 + r, remainingMonths) - 1));
            principalPaid = pmt - interestPaid;
          }
        }
      }
    }
    
    if (principalPaid > remainingBalance || month === effectiveMonths) {
       principalPaid = remainingBalance;
    }
    
    const monthlyTotal = principalPaid + interestPaid;
    remainingBalance -= principalPaid;
    
    monthlySchedule.push({
      month,
      year: Math.ceil(month / 12),
      principalPaid,
      interestPaid,
      totalPayment: monthlyTotal,
      remainingBalance,
      interestRate: currentRate
    });
    
    totalInterest += interestPaid;
    totalPayment += monthlyTotal;
    
    if (month === inputs.promoMonths) {
      rateCliffPaymentBefore = monthlyTotal;
    } else if (month === inputs.promoMonths + 1) {
      rateCliffPaymentAfter = monthlyTotal;
    }
  }
  
  const yearlySummaryMap = new Map<number, YearlySummaryItem>();
  for (const item of monthlySchedule) {
    let yearItem = yearlySummaryMap.get(item.year);
    if (!yearItem) {
      yearItem = {
        year: item.year,
        principalPaid: 0,
        interestPaid: 0,
        totalPayment: 0,
        remainingBalance: 0
      };
      yearlySummaryMap.set(item.year, yearItem);
    }
    yearItem.principalPaid += item.principalPaid;
    yearItem.interestPaid += item.interestPaid;
    yearItem.totalPayment += item.totalPayment;
    yearItem.remainingBalance = item.remainingBalance;
  }
  
  const yearlySummary = Array.from(yearlySummaryMap.values());
  
  let peakPayment = 0;
  for (const item of monthlySchedule) {
    if (item.totalPayment > peakPayment) {
      peakPayment = item.totalPayment;
    }
  }
  
  const interestToLoanRatio = inputs.loanAmount > 0 ? totalInterest / inputs.loanAmount : 0;
  
  return {
    monthlySchedule,
    yearlySummary,
    totalInterest,
    totalPayment,
    interestToLoanRatio,
    firstMonthPayment: monthlySchedule[0]?.totalPayment || 0,
    peakPayment,
    rateCliffPaymentBefore,
    rateCliffPaymentAfter
  };
}
