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
	name: 'Bond Ladders',
	description: 'Managed portfolios of individual bonds providing stable, predictable income.',
	category: 'income',

	store: {
		subscribe: ladderStore.subscribe,
		save: ladderStore.save,
		load: ladderStore.load,
		reset: ladderStore.reset,
		publicData: derived(ladderStore, ($state) => {
			const totalIncome = $state.ladders.reduce((sum, l) => sum + l.annualIncome, 0);
			const minYear = $state.ladders.length ? Math.min(...$state.ladders.map(l => l.startYear)) : new Date().getFullYear();
			const maxYear = $state.ladders.length ? Math.max(...$state.ladders.map(l => l.endYear)) : minYear + 30;
			
			return {
				hasLadders: $state.ladders.length > 0,
				totalIncome,
				startYear: minYear,
				endYear: maxYear,
				ladders: $state.ladders
			};
		})
	},

	engine: {
		calculate: (params) => {
			const state = get(ladderStore);
			return state.ladders.reduce((sum, l) => sum + l.annualIncome, 0);
		},
		getIncomeStream: (state): IncomeStream => {
			const annualAmounts: Record<number, number> = {};
			
			state.ladders.forEach(ladder => {
				for (let y = ladder.startYear; y <= ladder.endYear; y++) {
					annualAmounts[y] = (annualAmounts[y] || 0) + ladder.annualIncome;
				}
			});

			return {
				id: 'bond-ladders',
				name: 'Bond Ladder Income',
				annualAmounts,
				isGuaranteed: true,
				hasCOLA: true // Assuming inflation protection for TIPS, though 'simple' might vary
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
