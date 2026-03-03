import { describe, it, expect } from 'vitest';
import { parseHoldingsCsv } from './csv-parser';

describe('csv-parser', () => {
	it('parses standard CUSIP, Qty format', () => {
		const csv = `cusip,qty
91282CDX6,15000
91282CGK1,10000`;
		const result = parseHoldingsCsv(csv);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ cusip: '91282CDX6', qty: 15000 });
	});

	it('handles alternative headers (brokerage style)', () => {
		const csv = `Description,CUSIP,Face Value,Price
TIPS 2032,91282CDX6,5000,98.5`;
		const result = parseHoldingsCsv(csv);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({ cusip: '91282CDX6', qty: 5000 });
	});

	it('returns empty for invalid data', () => {
		const csv = `invalid,data
foo,bar`;
		const result = parseHoldingsCsv(csv);
		expect(result).toHaveLength(0);
	});
});
