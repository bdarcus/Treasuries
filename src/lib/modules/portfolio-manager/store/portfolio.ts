import { writable, derived, get } from 'svelte/store';

export interface MarketAssumptions {
	equityReturn: number;
	tipsReturn: number;
	inflation: number;
	updatedAt: string;
}

export interface PortfolioState {
	balance: number;
	equityAllocation: number; // 0.0 to 1.0
	expectedPortfolioYield: number; // Passive income rate (dividends + interest)
	bequestTarget: number;    // Future value at end of horizon
	marketAssumptions: MarketAssumptions;
	retirementYear: number;
	isLoaded: boolean;
}

const DEFAULT_STATE: PortfolioState = {
	balance: 1000000,
	equityAllocation: 0.6,
	expectedPortfolioYield: 0.02, // 2% default yield
	bequestTarget: 0,
	marketAssumptions: {
		equityReturn: 0.058,
		tipsReturn: 0.019,
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
						equityReturn: data.assumptions.globalEquities.nominalReturn,
						tipsReturn: data.assumptions.tips.realReturn, // We want the REAL return for TIPS
						inflation: data.assumptions.inflation,
						updatedAt: data.updatedAt
					}
				}));
			} catch (e) {
				console.warn('Using default assumptions:', e);
			}
		},
		save: (state: PortfolioState) => {
			console.log('Saving portfolio state:', state);
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('portfolio_manager_state', JSON.stringify({ ...state, isLoaded: true }));
			}
			set({ ...state, isLoaded: true });
		},
		load: () => {
			if (typeof localStorage !== 'undefined') {
				const saved = localStorage.getItem('portfolio_manager_state');
				if (saved) {
					set({ ...JSON.parse(saved), isLoaded: true });
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
 * Logic: We combine nominal returns, then adjust for inflation.
 */
export const expectedRealReturn = derived(portfolioStore, ($state) => {
	const nominalEquity = $state.marketAssumptions.equityReturn;
	const realTips = $state.marketAssumptions.tipsReturn;
	const inflation = $state.marketAssumptions.inflation;

	// Nominal return of the portfolio
	// For equities, we have the nominal return.
	// For TIPS, we have the REAL return, so nominal = (1+real)*(1+infl) - 1
	const nominalTips = (1 + realTips) * (1 + inflation) - 1;
	
	const portfolioNominal = ($state.equityAllocation * nominalEquity) + ((1 - $state.equityAllocation) * nominalTips);
	
	// Real return = (1 + nominal) / (1 + inflation) - 1
	return (1 + portfolioNominal) / (1 + inflation) - 1;
});
