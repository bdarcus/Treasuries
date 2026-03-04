import { localDate } from "./date";

export const TIPS_PAR_VALUE = 1000;

/**
 * Calculates the Real Yield from a given Clean Price.
 * Uses the Newton-Raphson method to solve the Present Value equation.
 * @reference Matches Excel YIELD(...,2,1) logic for semi-annual bonds.
 */
export function yieldFromPrice(
	cleanPrice: number,
	coupon: number,
	settleDateStr: string,
	maturityStr: string,
): number | null {
	if (!cleanPrice || cleanPrice <= 0) return null;
	const settle = localDate(settleDateStr);
	const mature = localDate(maturityStr);
	if (settle >= mature) return null;

	const semiCoupon = (coupon / 2) * 100;
	const matMon = mature.getMonth() + 1;
	const cm1 = matMon <= 6 ? matMon : matMon - 6;
	const cm2 = cm1 + 6;

	const nextCouponOnOrAfter = (d: Date): Date | null => {
		const candidates: Date[] = [];
		for (let year = d.getFullYear() - 1; year <= d.getFullYear() + 1; year++) {
			candidates.push(new Date(year, cm1 - 1, 15));
			candidates.push(new Date(year, cm2 - 1, 15));
		}
		candidates.sort((a, b) => a.getTime() - b.getTime());
		return candidates.find((c) => c >= d && c <= mature) || null;
	};

	const nextCoupon = nextCouponOnOrAfter(settle);
	if (!nextCoupon) return null;
	const lastCoupon = new Date(
		nextCoupon.getFullYear(),
		nextCoupon.getMonth() - 6,
		15,
	);

	const days = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 86400000;
	const E = days(lastCoupon, nextCoupon);
	const A = days(lastCoupon, settle);
	const DSC = days(settle, nextCoupon);
	const accrued = semiCoupon * (A / E);
	const dirtyPrice = cleanPrice + accrued;
	const w = DSC / E;

	const coupons: Date[] = [];
	let d = new Date(nextCoupon);
	while (d <= mature) {
		coupons.push(new Date(d));
		d = new Date(d.getFullYear(), d.getMonth() + 6, 15);
	}
	const N = coupons.length;
	if (N === 0) return null;

	const pv = (y: number) => {
		const r = y / 2;
		let s = 0;
		for (let k = 0; k < N; k++) {
			const cf = k === N - 1 ? semiCoupon + 100 : semiCoupon;
			s += cf / Math.pow(1 + r, w + k);
		}
		return s;
	};

	const dpv = (y: number) => {
		const r = y / 2;
		let s = 0;
		for (let k = 0; k < N; k++) {
			const cf = k === N - 1 ? semiCoupon + 100 : semiCoupon;
			s += (-cf * (w + k)) / (2 * Math.pow(1 + r, w + k + 1));
		}
		return s;
	};

	let y = coupon > 0.005 ? coupon : 0.02;
	for (let i = 0; i < 200; i++) {
		const diff = pv(y) - dirtyPrice;
		if (Math.abs(diff) < 1e-10) break;
		const deriv = dpv(y);
		if (Math.abs(deriv) < 1e-15) break;
		y -= diff / deriv;
	}
	return y;
}

/**
 * Calculates Modified Duration for a TIPS bond.
 */
export function calculateMDuration(
	settlement: Date,
	maturity: Date,
	coupon: number,
	yld: number,
): number {
	const months =
		(maturity.getFullYear() - settlement.getFullYear()) * 12 +
		(maturity.getMonth() - settlement.getMonth());
	const periods = Math.ceil(months / 6);

	let weightedSum = 0,
		pvSum = 0;
	for (let i = 1; i <= periods; i++) {
		const cashflow =
			i === periods ? 1000 + (coupon * 1000) / 2 : (coupon * 1000) / 2;
		const pv = cashflow / Math.pow(1 + yld / 2, i);
		weightedSum += i * pv;
		pvSum += pv;
	}
	const macaulayDuration = weightedSum / pvSum / 2;
	return macaulayDuration / (1 + yld / 2);
}

/**
 * Formats a number as USD currency.
 */
export function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}
