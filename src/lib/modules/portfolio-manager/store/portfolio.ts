import { writable, derived, get } from 'svelte/store';

export interface MarketAssumptions {
	equityRealReturn: number;
	equityYield: number;
	tipsRealReturn: number;
	tipsRealYield: number;
	inflation: number;
	updatedAt: string;
}

export interface PortfolioState {
	balance: number;
	equityAllocation: number; // 0.0 to 1.0
	bequestTarget: number;    // Future value at end of horizon
	marketAssumptions: MarketAssumptions;
	retirementYear: number;
	isLoaded: boolean;
}

const DEFAULT_STATE: PortfolioState = {
	balance: 1000000,
	equityAllocation: 0.6,
	bequestTarget: 0,
	marketAssumptions: {
		equityRealReturn: 0.037,
		equityYield: 0.021,
		tipsRealReturn: 0.019,
		tipsRealYield: 0.019,
		inflation: 0.021,
		updatedAt: '2026-03-01'
	},
	retirementYear: 2055,
	isLoaded: false
};

function createPortfolioStore() {
	const { subscribe, set, update } = writable<PortfolioState>(DEFAULT_STATE);

	return {
		subscribe,
		set,
		update,
		async fetchAssumptions() {
			try {
				const res = await fetch('/data/MarketAssumptions.json');
				if (!res.ok) throw new Error('Failed to fetch assumptions');
				const data = await res.json();
				update(s => ({
					...s,
					marketAssumptions: {
						equityRealReturn: data.assumptions.globalEquities.realReturn,
						equityYield: data.assumptions.globalEquities.dividendYield,
						tipsRealReturn: data.assumptions.tips.realReturn,
						tipsRealYield: data.assumptions.tips.realYield,
						inflation: data.assumptions.inflation,
						updatedAt: data.updatedAt
					}
				}));
			} catch (e) {
				console.warn('Using default assumptions:', e);
			}
		},
		save: (state: PortfolioState) => {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('portfolio_manager_state', JSON.stringify({ ...state, isLoaded: true }));
			}
			set({ ...state, isLoaded: true });
		},
		load: () => {
			if (typeof localStorage !== 'undefined') {
				const saved = localStorage.getItem('portfolio_manager_state');
				if (saved) {
					set({ ...DEFAULT_STATE, ...JSON.parse(saved), isLoaded: true });
					return;
				}
			}
			set({ ...DEFAULT_STATE, isLoaded: true });
		},
		reset: () => {
			if (typeof localStorage !== 'undefined') {
				localStorage.removeItem('portfolio_manager_state');
			}
			set({ ...DEFAULT_STATE, isLoaded: true });
		}
	};
}

export const portfolioStore = createPortfolioStore();

/**
 * Derived store that calculates the weighted expected REAL return.
 */
export const expectedRealReturn = derived(portfolioStore, ($state) => {
	const realEquity = $state.marketAssumptions.equityRealReturn;
	const realTips = $state.marketAssumptions.tipsRealReturn;
	return ($state.equityAllocation * realEquity) + ((1 - $state.equityAllocation) * realTips);
});

/**
 * Derived store that calculates the weighted REAL yield (passive income portion).
 */
export const expectedRealYield = derived(portfolioStore, ($state) => {
	const yldEquity = $state.marketAssumptions.equityYield;
	const yldTips = $state.marketAssumptions.tipsRealYield;
	return ($state.equityAllocation * yldEquity) + ((1 - $state.equityAllocation) * yldTips);
});
