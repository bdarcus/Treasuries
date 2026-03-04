/**
 * Converts an array of arrays into a CSV string and triggers a browser download.
 */
export function exportToCsv(
	filename: string,
	headers: string[],
	rows: any[][],
) {
	const content = [
		headers.join(","),
		...rows.map((row) =>
			row
				.map((cell) => {
					const str = String(cell ?? "");
					// Escape quotes and wrap in quotes if contains comma or newline
					if (str.includes(",") || str.includes("\n") || str.includes('"')) {
						return `"${str.replace(/"/g, '""')}"`;
					}
					return str;
				})
				.join(","),
		),
	].join("\n");

	const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", filename);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
}
