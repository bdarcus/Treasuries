import { buildTipsMapFromYields, localDate } from './rebalance-engine.js';

export interface MarketData {
	tipsMap: Map<string, any>;
	refCpiRows: { date: string; refCpi: number }[];
	settlementDate: Date;
}

export async function fetchMarketData(): Promise<MarketData> {
	const [yRes, rRes] = await Promise.all([
		fetch('/data/TipsYields.csv'),
		fetch('/data/RefCPI.csv')
	]);

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
	const refCpiRows = parse(await rRes.text()).map((r: any) => ({
		date: r.date,
		refCpi: parseFloat(r.refCpi)
	}));

	const settlementDate = localDate(yields[0].settlementDate);
	const tipsMap = buildTipsMapFromYields(
		yields.map((r: any) => ({
			...r,
			coupon: parseFloat(r.coupon),
			baseCpi: parseFloat(r.baseCpi),
			price: parseFloat(r.price) || null,
			yield: parseFloat(r.yield) || null
		}))
	);

	return { tipsMap, refCpiRows, settlementDate };
}
