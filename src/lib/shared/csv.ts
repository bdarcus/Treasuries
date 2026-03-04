export interface HoldingRecord {
	cusip: string;
	qty: number;
}

/**
 * Parses a simple CSV with CUSIP, Qty
 */
export function parseHoldingsCsv(text: string): HoldingRecord[] {
	const lines = text
		.trim()
		.split("\n")
		.filter((l) => l.trim());
	if (lines.length < 2) return [];

	// Simple heuristic: find headers or assume CUSIP, Qty
	const header = lines[0].toLowerCase();
	const rows = lines.slice(1);

	return rows
		.map((row) => {
			const parts = row.split(",").map((p) => p.trim());
			if (header.includes("cusip")) {
				const cols = header.split(",").map((h) => h.trim());
				const cIdx = cols.indexOf("cusip");
				const qIdx = cols.findIndex(
					(h) =>
						h.includes("qty") || h.includes("quantity") || h.includes("face"),
				);
				return {
					cusip: parts[cIdx],
					qty: parseInt(parts[qIdx]) || 0,
				};
			}
			// Default to Col 0 = CUSIP, Col 1 = Qty
			return {
				cusip: parts[0],
				qty: parseInt(parts[1]) || 0,
			};
		})
		.filter((h) => h.cusip && h.qty > 0);
}
