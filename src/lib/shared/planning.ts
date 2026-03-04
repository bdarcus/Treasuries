import { writable, derived } from "svelte/store";
import {
	calculateTargetHorizon,
	getTargetProbFromMargin,
} from "../modules/smart-withdrawals/engine/life-expectancy";

export interface PersonInfo {
	age: number;
	gender: "male" | "female";
}

export interface PlanningState {
	people: PersonInfo[];
	conservatismMargin: number; // 0.0 to 1.0
}

const DEFAULT_STATE: PlanningState = {
	people: [
		{ age: 65, gender: "male" },
		{ age: 65, gender: "female" },
	],
	conservatismMargin: 0.5,
};

function createPlanningStore() {
	const { subscribe, set, update } = writable<PlanningState>(DEFAULT_STATE);

	return {
		subscribe,
		set,
		update,
		save: (state: PlanningState) => {
			if (typeof localStorage !== "undefined") {
				localStorage.setItem("planning_state", JSON.stringify(state));
			}
			set(state);
		},
		load: () => {
			if (typeof localStorage !== "undefined") {
				const saved = localStorage.getItem("planning_state");
				if (saved) {
					// Merge with DEFAULT_STATE to handle newly added fields
					set({ ...DEFAULT_STATE, ...JSON.parse(saved) });
					return;
				}
			}
			set(DEFAULT_STATE);
		},
	};
}

export const planningStore = createPlanningStore();

/**
 * Derived store for the shared planning horizon.
 */
export const planningHorizon = derived(planningStore, ($state) => {
	const targetProb = getTargetProbFromMargin($state.conservatismMargin);
	const years = calculateTargetHorizon($state.people, targetProb);
	return {
		yearsRemaining: years,
		horizonYear: new Date().getFullYear() + Math.round(years),
		targetProb,
	};
});
