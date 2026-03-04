import { writable } from 'svelte/store';

export type COLA = 'None' | 'CPI' | 'Fixed';

export interface PensionState {
	amount: number;       // Monthly amount
	startYear: number;
	colaType: COLA;
	fixedColaRate: number; // e.g. 0.02
	isLoaded: boolean;
}

const DEFAULT_STATE: PensionState = {
	amount: 2000,
	startYear: 2030,
	colaType: 'None',
	fixedColaRate: 0.02,
	isLoaded: false
};

function createPensionStore() {
	const { subscribe, set, update } = writable<PensionState>(DEFAULT_STATE);

	return {
		subscribe,
		set,
		update,
		save: (state: PensionState) => {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('pension_module_state', JSON.stringify({ ...state, isLoaded: true }));
			}
			set({ ...state, isLoaded: true });
		},
		load: () => {
			if (typeof localStorage !== 'undefined') {
				const saved = localStorage.getItem('pension_module_state');
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

export const pensionStore = createPensionStore();
