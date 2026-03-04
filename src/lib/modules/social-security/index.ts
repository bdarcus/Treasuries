import { derived, get } from 'svelte/store';
import { ssStore, type SSState } from './store/ss';
import { planningStore, planningHorizon } from '../../shared/planning';
import type { FinancialModule, IncomeStream } from '../../core/types';

// Components
import SSIcon from './components/SSIcon.svelte';
import SSConfig from './components/SSConfig.svelte';
import SSDashboard from './components/SSDashboard.svelte';
import SSAnalysis from './components/SSAnalysis.svelte';

export const SocialSecurityModule: FinancialModule<SSState> = {
	id: 'social-security',
	name: 'Social Security',
	description: 'Federal retirement benefits based on claiming age.',
	category: 'income',

	store: {
		subscribe: ssStore.subscribe,
		save: ssStore.save,
		load: ssStore.load,
		reset: ssStore.reset,
		publicData: derived(ssStore, ($state) => ({
			annualBenefit: $state.annualBenefit,
			claimingAge: $state.claimingAge
		}))
	},

	engine: {
		calculate: (params) => {
			const state = get(ssStore);
			const planning = get(planningStore);
			const horizon = get(planningHorizon);
			
			const primaryPerson = planning.people[0]; // Logic for first person
			const startYear = new Date().getFullYear() + (state.claimingAge - primaryPerson.age);
			
			return {
				annualBenefit: state.annualBenefit,
				startYear,
				isCurrentlyClaimed: primaryPerson.age >= state.claimingAge
			};
		},
		getIncomeStream: (state): IncomeStream => {
			const planning = get(planningStore);
			const horizon = get(planningHorizon);
			const primaryPerson = planning.people[0];
			
			const claimingYear = new Date().getFullYear() + (state.claimingAge - primaryPerson.age);
			const endYear = horizon.horizonYear;
			
			const annualAmounts: Record<number, number> = {};
			for (let y = claimingYear; y <= endYear; y++) {
				annualAmounts[y] = state.annualBenefit;
			}
			
			return {
				id: 'social-security',
				name: 'Social Security',
				annualAmounts,
				isGuaranteed: true,
				hasCOLA: true
			};
		}
	},

	ui: {
		Icon: SSIcon,
		Config: SSConfig,
		Dashboard: SSDashboard,
		Analysis: SSAnalysis
	}
};
