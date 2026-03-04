/**
 * Parses YYYY-MM-DD as a local date (preventing UTC shift).
 */
export function localDate(str: string): Date {
	const [y, m, d] = str.split("-").map(Number);
	return new Date(y, m - 1, d);
}

/**
 * Formats a Date object to YYYY-MM-DD string.
 */
export function toDateStr(date: Date): string {
	return date.toLocaleDateString("en-CA");
}

/**
 * Formats a Date object for display (MM/DD/YY).
 */
export function fmtDate(date: Date): string {
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	const y = String(date.getFullYear()).slice(2);
	return `${m}/${d}/${y}`;
}
