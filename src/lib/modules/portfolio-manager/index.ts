import { derived, get } from 'svelte/store';
import { portfolioStore, expectedRealReturn, type PortfolioState } from './store/portfolio';
import { calculateConstantAmortization, projectPortfolio } from './engine/amortization';
import { planningHorizon } from '../../shared/planning';
import type { FinancialModule, ProjectionData } from '../../core/types';

// Placeholder components
import PortfolioIcon from './components/PortfolioIcon.svelte';
import PortfolioConfig from './components/PortfolioConfig.svelte';
import PortfolioDashboard from './components/PortfolioDashboard.svelte';
import PortfolioAnalysis from './components/PortfolioAnalysis.svelte';

/**
 * Implementation of the Total Portfolio Module (Merton-Inspired).
 */
export const TotalPortfolioModule: FinancialModule<PortfolioState, any, any> = {
	id: 'portfolio-manager',
	name: 'Total Portfolio',
	description: 'Merton-inspired constant amortization and risk-based allocation.',

	store: {
		subscribe: portfolioStore.subscribe,
		save: portfolioStore.save,
		load: portfolioStore.load,
		reset: portfolioStore.reset,
		publicData: derived([portfolioStore, expectedRealReturn], ([$state, $realReturn]) => ({
			totalBalance: $state.balance,
			equityAllocation: $state.equityAllocation,
			expectedRealReturn: $realReturn,
			bequestTarget: $state.bequestTarget
		}))
	},

	engine: {
		calculate: (params) => {
			const realRate = get(expectedRealReturn);
			const state = get(portfolioStore);
			const horizon = get(planningHorizon);
			
			const horizonYear = horizon.horizonYear;
			const yearsRemaining = horizonYear - new Date().getFullYear();
			
			return {
				amortizationIncome: calculateConstantAmortization(state.balance, realRate, Math.max(1, yearsRemaining), state.bequestTarget),
				expectedRealReturn: realRate,
				horizonYear
			};
		},
		project: (state): ProjectionData => {
			const realRate = get(expectedRealReturn);
			const horizon = get(planningHorizon);
			const horizonYear = horizon.horizonYear;
			
			const yearsRemaining = Math.max(1, horizonYear - new Date().getFullYear());
			const income = calculateConstantAmortization(state.balance, realRate, yearsRemaining, state.bequestTarget);
			const balances = projectPortfolio(state.balance, realRate, yearsRemaining, income);
			
			const startYear = new Date().getFullYear();
			return {
				years: Array.from({ length: balances.length }, (_, i) => startYear + i),
				values: balances
			};
		}
	},

	ui: {
		Icon: PortfolioIcon,
		Config: PortfolioConfig,
		Dashboard: PortfolioDashboard,
		Analysis: PortfolioAnalysis
	}
};
