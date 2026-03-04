import { get } from "svelte/store";
import { ladderStore } from "../modules/tips-ladder/store/ladder";
import { portfolioStore } from "../modules/portfolio-manager/store/portfolio";
import { planningStore } from "./planning";

/**
 * Aggregates all application data into a single serializable object.
 */
export function exportAllData() {
	const data = {
		version: "1.0",
		timestamp: new Date().toISOString(),
		tips: get(ladderStore),
		portfolio: get(portfolioStore),
		planning: get(planningStore),
	};

	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `financial-plan-${new Date().toLocaleDateString("en-CA")}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

/**
 * Parses and hydrates all stores from a single data object.
 */
export function importAllData(json: string) {
	try {
		const data = JSON.parse(json);

		if (data.tips) ladderStore.save(data.tips);
		if (data.portfolio) portfolioStore.save(data.portfolio);
		if (data.planning) planningStore.save(data.planning);

		return true;
	} catch (e) {
		console.error("Import failed:", e);
		return false;
	}
}
