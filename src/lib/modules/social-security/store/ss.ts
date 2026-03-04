import { writable } from 'svelte/store';

export interface SSState {
	annualBenefit: number; // Real dollars
	claimingAge: number;   // 62-70
	isLoaded: boolean;
}

const DEFAULT_STATE: SSState = {
	annualBenefit: 30000,
	claimingAge: 67,
	isLoaded: false
};

function createSSStore() {
	const { subscribe, set, update } = writable<SSState>(DEFAULT_STATE);

	return {
		subscribe,
		set,
		update,
		save: (state: SSState) => {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('ss_module_state', JSON.stringify({ ...state, isLoaded: true }));
			}
			set({ ...state, isLoaded: true });
		},
		load: () => {
			if (typeof localStorage !== 'undefined') {
				const saved = localStorage.getItem('ss_module_state');
				if (saved) {
					set({ ...DEFAULT_STATE, ...JSON.parse(saved), isLoaded: true });
					return;
				}
			}
			set({ ...DEFAULT_STATE, isLoaded: true });
		},
		reset: () => {
			set({ ...DEFAULT_STATE, isLoaded: true });
		}
	};
}

export const ssStore = createSSStore();
