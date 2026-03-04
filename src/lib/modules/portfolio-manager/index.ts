import { derived, get } from 'svelte/store';
import { portfolioStore, expectedRealReturn, expectedRealYield, type PortfolioState } from './store/portfolio';
import { calculateConstantAmortization, projectPortfolio } from './engine/amortization';
import { planningHorizon } from '../../shared/planning';
import type { FinancialModule, ProjectionData, IncomeStream } from '../../core/types';

// Components
import PortfolioIcon from './components/PortfolioIcon.svelte';
import PortfolioConfig from './components/PortfolioConfig.svelte';
import PortfolioDashboard from './components/PortfolioDashboard.svelte';
import PortfolioAnalysis from './components/PortfolioAnalysis.svelte';

export const TotalPortfolioModule: FinancialModule = {
	id: 'portfolio-manager',
	name: 'Total Portfolio',
	description: 'Merton-inspired constant amortization and risk-based allocation.',
	category: 'portfolio',

	store: {
		subscribe: portfolioStore.subscribe,
		save: portfolioStore.save,
		load: portfolioStore.load,
		reset: portfolioStore.reset,
		publicData: derived([portfolioStore, expectedRealReturn, expectedRealYield], ([$state, $realReturn, $realYield]) => ({
			totalBalance: $state.balance,
			equityAllocation: $state.equityAllocation,
			expectedRealReturn: $realReturn,
			expectedRealYield: $realYield,
			bequestTarget: $state.bequestTarget
		}))
	},

	engine: {
		calculate: (params) => {
			const realRate = get(expectedRealReturn);
			const realYield = get(expectedRealYield);
			const state = get(portfolioStore);
			const horizon = get(planningHorizon);
			
			const horizonYear = horizon.horizonYear;
			const yearsRemaining = Math.max(1, horizonYear - new Date().getFullYear());
			
			const totalAmortizedIncome = calculateConstantAmortization(state.balance, realRate, yearsRemaining, state.bequestTarget);
			const passiveIncome = state.balance * realYield;
			const portfolioSales = Math.max(0, totalAmortizedIncome - passiveIncome);

			return {
				amortizationIncome: totalAmortizedIncome,
				passiveIncome,
				portfolioSales,
				expectedRealReturn: realRate,
				expectedRealYield: realYield,
				horizonYear
			};
		},
		getIncomeStream: (state): IncomeStream => {
			// Portfolio income is dynamic, but for the summary we show the first year's amortized safe spend
			const realRate = get(expectedRealReturn);
			const horizon = get(planningHorizon);
			const yearsRemaining = Math.max(1, horizon.horizonYear - new Date().getFullYear());
			const income = calculateConstantAmortization(state.balance, realRate, yearsRemaining, state.bequestTarget);

			const annualAmounts: Record<number, number> = {};
			const start = new Date().getFullYear();
			for (let i = 0; i <= yearsRemaining; i++) {
				annualAmounts[start + i] = income;
			}

			return {
				id: 'portfolio-manager',
				name: 'Portfolio Withdrawal',
				annualAmounts,
				isGuaranteed: false,
				hasCOLA: true
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
