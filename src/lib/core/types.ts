import type { SvelteComponent } from 'svelte';
import type { Readable } from 'svelte/store';

/**
 * Standard data structure for a year-by-year financial projection.
 */
export interface ProjectionData {
	years: number[];
	values: number[];
}

/**
 * Standard data structure for income streams.
 * Allows the withdrawal engine to aggregate income from any module.
 */
export interface IncomeStream {
	id: string;
	name: string;
	annualAmounts: Record<number, number>; // Year -> Real Amount
	isGuaranteed: boolean;
	hasCOLA: boolean;
}

/**
 * The core interface for a pluggable financial feature.
 */
export interface FinancialModule<TState = any, TCalc = any, TPublic = any> {
	id: string;
	name: string;
	description: string;
	category: 'income' | 'portfolio' | 'liability';
	
	// State & Persistence
	store: {
		subscribe: (run: (value: TState) => void) => () => void;
		load: () => void;
		save: (state: TState) => void;
		reset: () => void;
		// Data exposed to other modules (e.g., for the withdrawal engine)
		publicData: Readable<TPublic>;
	};

	// Calculation Engines
	engine: {
		calculate: (params: any) => TCalc;
		project?: (state: TState) => ProjectionData;
		// Returns the real income stream for the planning horizon
		getIncomeStream?: (state: TState) => IncomeStream;
	};

	// UI Components
	ui: {
		Icon: any;
		Config: any;
		Dashboard: any;
		Analysis: any;
		Import?: any;
	};
}
