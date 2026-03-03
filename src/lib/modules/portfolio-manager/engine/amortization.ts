/**
 * Calculates the constant real amortization amount for a given portfolio balance,
 * expected real rate of return, time horizon, and a future bequest target.
 * 
 * Formula: PMT = (P - B * (1+r)^-n) * r / (1 - (1+r)^-n)
 * Where P = Principal, B = Bequest (Future Value), r = real rate, n = horizon years.
 */
export function calculateConstantAmortization(balance: number, realRate: number, yearsRemaining: number, bequest: number = 0): number {
	if (yearsRemaining <= 0) return Math.max(0, balance - bequest);
	
	// Present Value of the Bequest
	const pvBequest = bequest * Math.pow(1 + realRate, -yearsRemaining);
	const amortizableBalance = balance - pvBequest;

	if (realRate === 0) return Math.max(0, amortizableBalance / yearsRemaining);

	// Annuity formula for real spending
	// PMT = (P_amortizable * r) / (1 - (1 + r)^(-n))
	return Math.max(0, (amortizableBalance * realRate) / (1 - Math.pow(1 + realRate, -yearsRemaining)));
}

/**
 * Projects the portfolio balance into the future based on the amortization income.
 */
export function projectPortfolio(balance: number, realRate: number, horizon: number, incomePerYear: number): number[] {
	const projection: number[] = [balance];
	let currentBalance = balance;
	for (let i = 0; i < horizon; i++) {
		// New balance = (Prev balance - spending) * (1 + growth)
		currentBalance = (currentBalance - incomePerYear) * (1 + realRate);
		projection.push(Math.max(0, currentBalance));
	}
	return projection;
}
