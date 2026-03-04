import { writable } from 'svelte/store';

export type LadderType = 'tips-manual' | 'simple-income';

export interface BondLadder {
	id: string;
	name: string;
	type: LadderType;
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
	ladders: []
};

function createLadderStore() {
	const { subscribe, set, update } = writable<LadderState>(DEFAULT_STATE);

	return {
		subscribe,
		set,
		update,
		addLadder: (ladder: Omit<BondLadder, 'id'>) => {
			update(state => ({
				...state,
				ladders: [...state.ladders, { ...ladder, id: crypto.randomUUID() }]
			}));
		},
		removeLadder: (id: string) => {
			update(state => ({
				...state,
				ladders: state.ladders.filter(l => l.id !== id)
			}));
		},
		updateLadder: (id: string, updates: Partial<BondLadder>) => {
			update(state => ({
				...state,
				ladders: state.ladders.map(l => l.id === id ? { ...l, ...updates } : l)
			}));
		},
		save: (state: LadderState) => {
			if (typeof localStorage !== 'undefined') {
				try { localStorage.setItem('tips_ladder_state', JSON.stringify(state)); } catch (e) { console.warn('localStorage unavailable (save):', e); }
			}
			set(state);
		},
		load: () => {
			if (typeof localStorage !== 'undefined') {
				try {
					const saved = localStorage.getItem('tips_ladder_state');
					if (saved) {
						const parsed = JSON.parse(saved);
						// Migration for old state format
						if (parsed.target && !parsed.ladders) {
							const legacyLadder: BondLadder = {
								id: 'legacy-tips',
								name: 'Existing TIPS Ladder',
								type: 'tips-manual',
								holdings: parsed.holdings || [],
								startYear: parsed.target.startYear,
								endYear: parsed.target.endYear,
								annualIncome: parsed.target.income
							};
							set({ ladders: [legacyLadder] });
						} else {
							set(parsed);
						}
					}
				} catch (e) { console.warn('localStorage unavailable (load):', e); }
			}
		},
		reset: () => {
			if (typeof localStorage !== 'undefined') {
				try { localStorage.removeItem('tips_ladder_state'); } catch (e) { console.warn('localStorage unavailable (reset):', e); }
			}
			set(DEFAULT_STATE);
		}
	};
}

export const ladderStore = createLadderStore();
