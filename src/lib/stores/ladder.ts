import { writable } from 'svelte/store';

export interface LadderState {
	holdings: { cusip: string; qty: number }[];
	target: {
		startYear: number;
		endYear: number;
		income: number;
	} | null;
	lastResults: any | null;
}

const DEFAULT_STATE: LadderState = {
	holdings: [],
	target: null,
	lastResults: null
};

function createLadderStore() {
	const { subscribe, set, update } = writable<LadderState>(DEFAULT_STATE);

	return {
		subscribe,
		set,
		update,
		save: (state: LadderState) => {
			if (typeof window !== 'undefined' || typeof globalThis.localStorage !== 'undefined') {
				localStorage.setItem('tips_ladder_state', JSON.stringify(state));
			}
			set(state);
		},
		load: () => {
			if (typeof window !== 'undefined' || typeof globalThis.localStorage !== 'undefined') {
				const saved = localStorage.getItem('tips_ladder_state');
				if (saved) {
					set(JSON.parse(saved));
				}
			}
		},
		reset: () => {
			if (typeof window !== 'undefined' || typeof globalThis.localStorage !== 'undefined') {
				localStorage.removeItem('tips_ladder_state');
			}
			set(DEFAULT_STATE);
		}
	};
}

export const ladderStore = createLadderStore();
