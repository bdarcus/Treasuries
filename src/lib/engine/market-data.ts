import { buildTipsMapFromYields, localDate } from './rebalance-engine.js';

export interface MarketData {
	tipsMap: Map<string, any>;
	refCpiRows: { date: string; refCpi: number }[];
	settlementDate: Date;
}

/**
 * Returns the most recent RefCPI value whose date is on or before `dateStr`.
 * Throws a descriptive error if no matching row exists.
 */
export function getRefCpi(refCpiRows: { date: string; refCpi: number }[], dateStr: string): number {
	for (let i = refCpiRows.length - 1; i >= 0; i--) {
		if (refCpiRows[i].date <= dateStr) return refCpiRows[i].refCpi;
	}
	throw new Error(`No RefCPI data available for settlement date: ${dateStr}`);
}

export async function fetchMarketData(): Promise<MarketData> {
	const [yRes, rRes] = await Promise.all([
		fetch('/data/TipsYields.csv'),
		fetch('/data/RefCPI.csv')
	]);

	if (!yRes.ok) throw new Error(`Failed to fetch TipsYields.csv: ${yRes.status} ${yRes.statusText}`);
	if (!rRes.ok) throw new Error(`Failed to fetch RefCPI.csv: ${rRes.status} ${rRes.statusText}`);

	const parse = (t: string) => {
		const lines = t.trim().split('\n').filter((l) => l.trim());
		if (lines.length < 2) return [];
		const h = lines[0].split(',').map((s) => s.trim());
		return lines.slice(1).map((l) => {
			const v = l.split(',').map((s) => s.trim());
			return h.reduce((o, k, i) => ({ ...o, [k]: v[i] }), {} as any);
		});
	};

	const yields = parse(await yRes.text());
	if (yields.length === 0) throw new Error('TipsYields.csv is empty or has no data rows.');

	const refCpiRows = parse(await rRes.text()).map((r: any) => ({
		date: r.date,
		refCpi: parseFloat(r.refCpi)
	}));

	const settlementDate = localDate(yields[0].settlementDate);
	const tipsMap = buildTipsMapFromYields(
		yields.map((r: any) => {
			const price = parseFloat(r.price);
			const yld = parseFloat(r.yield);
			return {
				...r,
				coupon: parseFloat(r.coupon),
				baseCpi: parseFloat(r.baseCpi),
				price: Number.isNaN(price) ? null : price,
				yield: Number.isNaN(yld) ? null : yld
			};
		})
	);

	return { tipsMap, refCpiRows, settlementDate };
}
