import { derived, get } from 'svelte/store';
import { withdrawalStore, type WithdrawalState } from './store/withdrawal';
import { planningStore, planningHorizon } from '../../shared/planning';
import { calculateConstantAmortization } from '../portfolio-manager/engine/amortization';
import { registry } from '../../core/registry.svelte';
import type { FinancialModule, ProjectionData } from '../../core/types';

// Placeholder components
import WithdrawalIcon from './components/WithdrawalIcon.svelte';
import WithdrawalConfig from './components/WithdrawalConfig.svelte';
import WithdrawalDashboard from './components/WithdrawalDashboard.svelte';
import WithdrawalAnalysis from './components/WithdrawalAnalysis.svelte';

/**
 * Implementation of the Smart Withdrawal Module (Merton-Inspired).
 * This module coordinates data from the TIPS and Portfolio modules.
 */
export const SmartWithdrawalModule: FinancialModule<any, any, any> = {
	id: 'smart-withdrawals',
	name: 'Smart Withdrawal',
	description: 'Merton-inspired dynamic spending using joint life expectancy.',
	category: 'portfolio',

	store: {
		subscribe: planningStore.subscribe,
		save: planningStore.save,
		load: planningStore.load,
		reset: () => planningStore.update(() => ({ people: [{ age: 65, gender: 'male' }, { age: 65, gender: 'female' }], conservatismMargin: 0.5 })),
		publicData: derived([planningHorizon], ([$horizon]) => ({
			planningHorizonYears: $horizon.yearsRemaining,
			horizonYear: $horizon.horizonYear,
			targetSurvivalProb: $horizon.targetProb
		}))
	},

	engine: {
		calculate: (params) => {
			const horizon = get(planningHorizon);
			const yearsRemaining = horizon.yearsRemaining;

			// Pull data from other enabled modules via the registry
			const enabledModules = registry.enabledModulesList;
			const incomeStreams = enabledModules
				.filter(m => m.category === 'income')
				.map(m => m.engine.getIncomeStream?.(get(m.store as any)));
			
			// Portfolio module is handled separately as the "upside" source
			const portfolioModule = registry.getModule('portfolio-manager');
			const portfolioCalc = portfolioModule ? portfolioModule.engine.calculate({}) : { amortizationIncome: 0, passiveIncome: 0, portfolioSales: 0 };

			// Aggregate income from all enabled income modules
			const totalIncomeFromModules = incomeStreams.reduce((acc, stream) => {
				if (!stream) return acc;
				const currentYear = new Date().getFullYear();
				return acc + (stream.annualAmounts[currentYear] || 0);
			}, 0);

			// Dynamic Spending Breakdown
			const safeAssets = totalIncomeFromModules;
			const passiveIncome = portfolioCalc.passiveIncome || 0;
			const portfolioSales = portfolioCalc.portfolioSales || 0;
			
			const totalSpending = safeAssets + passiveIncome + portfolioSales;

			return {
				totalSpending,
				safeAssets,
				passiveIncome,
				portfolioSales,
				yearsRemaining,
				targetProb: horizon.targetProb,
				horizonYear: horizon.horizonYear
			};
		},
		getIncomeStream: (state): any => {
			return null;
		},
		project: (state): ProjectionData => {
			// Spending projection
			const calc = SmartWithdrawalModule.engine.calculate({});
			const years: number[] = [];
			const values: number[] = [];
			const startYear = new Date().getFullYear();
			
			for (let i = 0; i < calc.yearsRemaining; i++) {
				years.push(startYear + i);
				values.push(calc.totalSpending);
			}

			return { years, values };
		}
	},

	ui: {
		Icon: WithdrawalIcon,
		Config: WithdrawalConfig,
		Dashboard: WithdrawalDashboard,
		Analysis: WithdrawalAnalysis
	}
};
