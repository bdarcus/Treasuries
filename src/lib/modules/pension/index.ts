import { derived, get } from 'svelte/store';
import { pensionStore, type PensionState } from './store/pension';
import { planningHorizon } from '../../shared/planning';
import { portfolioStore } from '../portfolio-manager/store/portfolio';
import type { FinancialModule, IncomeStream } from '../../core/types';

// Components
import PensionIcon from './components/PensionIcon.svelte';
import PensionConfig from './components/PensionConfig.svelte';
import PensionDashboard from './components/PensionDashboard.svelte';
import PensionAnalysis from './components/PensionAnalysis.svelte';

export const PensionModule: FinancialModule<PensionState> = {
	id: 'pension',
	name: 'Pension',
	description: 'Fixed monthly income from an employer or annuity.',
	category: 'income',

	store: {
		subscribe: pensionStore.subscribe,
		save: pensionStore.save,
		load: pensionStore.load,
		reset: pensionStore.reset,
		publicData: derived(pensionStore, ($state) => ({
			amount: $state.amount,
			startYear: $state.startYear,
			colaType: $state.colaType
		}))
	},

	engine: {
		calculate: (params) => {
			const state = get(pensionStore);
			return {
				monthlyReal: state.amount,
				annualReal: state.amount * 12
			};
		},
		getIncomeStream: (state): IncomeStream => {
			const horizon = get(planningHorizon);
			const market = get(portfolioStore).marketAssumptions;
			const endYear = horizon.horizonYear;
			
			const annualAmounts: Record<number, number> = {};
			const baseAnnual = state.amount * 12;
			
			for (let y = state.startYear; y <= endYear; y++) {
				const yearsElapsed = y - state.startYear;
				
				if (state.colaType === 'CPI') {
					// Real value stays constant
					annualAmounts[y] = baseAnnual;
				} else if (state.colaType === 'Fixed') {
					// Nominal increases by fixed rate, but real value is adjusted by inflation
					// Real = Nominal / (1+infl)^years
					const nominal = baseAnnual * Math.pow(1 + state.fixedColaRate, yearsElapsed);
					annualAmounts[y] = nominal / Math.pow(1 + market.inflation, yearsElapsed);
				} else {
					// No COLA: Nominal is constant, real value shrinks by inflation
					annualAmounts[y] = baseAnnual / Math.pow(1 + market.inflation, yearsElapsed);
				}
			}
			
			return {
				id: 'pension',
				name: 'Pension',
				annualAmounts,
				isGuaranteed: true,
				hasCOLA: state.colaType === 'CPI'
			};
		}
	},

	ui: {
		Icon: PensionIcon,
		Config: PensionConfig,
		Dashboard: PensionDashboard,
		Analysis: PensionAnalysis
	}
};
