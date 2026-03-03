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
			if (typeof localStorage !== 'undefined') {
				try { localStorage.setItem('tips_ladder_state', JSON.stringify(state)); } catch (e) { console.warn('localStorage unavailable (save):', e); }
			}
			set(state);
		},
		load: () => {
			if (typeof localStorage !== 'undefined') {
				try {
					const saved = localStorage.getItem('tips_ladder_state');
					if (saved) set(JSON.parse(saved));
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
