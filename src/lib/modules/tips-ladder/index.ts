import { derived, get } from 'svelte/store';
import { ladderStore } from './store/ladder';
import type { FinancialModule, IncomeStream } from '../../core/types';

// Components
import TipsIcon from './components/TipsIcon.svelte';
import TipsConfig from './components/TipsConfig.svelte';
import TipsDashboard from './components/TipsDashboard.svelte';
import TipsAnalysis from './components/TipsAnalysis.svelte';
import TipsImport from './components/TipsImport.svelte';

export const TipsLadderModule: FinancialModule = {
	id: 'tips-ladder',
	name: 'TIPS Ladder',
	description: 'A guaranteed, inflation-protected floor of individual bonds.',
	category: 'income',

	store: {
		subscribe: ladderStore.subscribe,
		save: ladderStore.save,
		load: ladderStore.load,
		reset: ladderStore.reset,
		publicData: derived(ladderStore, ($state) => ({
			hasTarget: !!$state.target,
			income: $state.target?.income || 0,
			startYear: $state.target?.startYear,
			endYear: $state.target?.endYear
		}))
	},

	engine: {
		calculate: (params) => {
			const state = get(ladderStore);
			return state.target?.income || 0;
		},
		getIncomeStream: (state): IncomeStream => {
			const income = state.target?.income || 0;
			const start = state.target?.startYear || new Date().getFullYear();
			const end = state.target?.endYear || start + 30;
			
			const annualAmounts: Record<number, number> = {};
			for (let y = start; y <= end; y++) {
				annualAmounts[y] = income;
			}
			
			return {
				id: 'tips-ladder',
				name: 'TIPS Ladder Floor',
				annualAmounts,
				isGuaranteed: true,
				hasCOLA: true
			};
		}
	},

	ui: {
		Icon: TipsIcon,
		Config: TipsConfig,
		Dashboard: TipsDashboard,
		Analysis: TipsAnalysis,
		Import: TipsImport
	}
};
