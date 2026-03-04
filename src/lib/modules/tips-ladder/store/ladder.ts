import { writable } from "svelte/store";

export type LadderType = "tips-manual" | "simple-income";

export interface BondLadder {
	id: string;
	name: string;
	type: LadderType;
	taxStatus: "taxable" | "tax-free" | "deferred";
	// For 'tips-manual'
	holdings?: { cusip: string; qty: number }[];
	// Common / For 'simple-income'
	startYear: number;
	endYear: number;
	annualIncome: number;
}

export interface LadderState {
	ladders: BondLadder[];
}

const DEFAULT_STATE: LadderState = {
	ladders: [],
};

function createLadderStore() {
	const { subscribe, set, update } = writable<LadderState>(DEFAULT_STATE);

	return {
		subscribe,
		set,
		update,
		addLadder: (ladder: Omit<BondLadder, "id">) => {
			update((state) => ({
				...state,
				ladders: [...state.ladders, { ...ladder, id: crypto.randomUUID() }],
			}));
		},
		removeLadder: (id: string) => {
			update((state) => ({
				...state,
				ladders: state.ladders.filter((l) => l.id !== id),
			}));
		},
		updateLadder: (id: string, updates: Partial<BondLadder>) => {
			update((state) => ({
				...state,
				ladders: state.ladders.map((l) =>
					l.id === id ? { ...l, ...updates } : l,
				),
			}));
		},
		save: (state: LadderState) => {
			if (typeof localStorage !== "undefined") {
				try {
					localStorage.setItem("tips_ladder_state", JSON.stringify(state));
				} catch (e) {
					console.warn("localStorage unavailable (save):", e);
				}
			}
			set(state);
		},
		load: () => {
			if (typeof localStorage !== "undefined") {
				try {
					const saved = localStorage.getItem("tips_ladder_state");
					if (saved) {
						const parsed = JSON.parse(saved);
						// Migration for old state format (has target or holdings but no ladders array)
						if ((parsed.target || parsed.holdings) && !parsed.ladders) {
							const legacyLadder: BondLadder = {
								id: "legacy-tips",
								name: "Existing TIPS Ladder",
								type: "tips-manual",
								taxStatus: "taxable",
								holdings: parsed.holdings || [],
								startYear: parsed.target?.startYear || new Date().getFullYear(),
								endYear: parsed.target?.endYear || new Date().getFullYear() + 9,
								annualIncome: parsed.target?.income || 0,
							};
							const newState = { ladders: [legacyLadder] };
							set(newState);
							// Save the migrated state immediately
							localStorage.setItem(
								"tips_ladder_state",
								JSON.stringify(newState),
							);
						} else {
							set(parsed);
						}
					}
				} catch (e) {
					console.warn("localStorage unavailable (load):", e);
				}
			}
		},
		reset: () => {
			if (typeof localStorage !== "undefined") {
				try {
					localStorage.removeItem("tips_ladder_state");
				} catch (e) {
					console.warn("localStorage unavailable (reset):", e);
				}
			}
			set(DEFAULT_STATE);
		},
	};
}

export const ladderStore = createLadderStore();
