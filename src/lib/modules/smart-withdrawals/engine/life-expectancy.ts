/**
 * Period Life Table probabilities (Approximate SSA 2020 Data)
 * Returns mortality rate qx (prob of dying within 1 year) given current age.
 */
function getMortalityRate(age: number, gender: 'male' | 'female'): number {
	// Gompertz-Makeham Law: qx = alpha * exp(beta * age)
	// Parameters tuned to match SSA 2020 mortality rates roughly
	const beta = 0.095;
	const alpha = gender === 'female' ? 0.000025 : 0.000035;
	
	const qx = alpha * Math.exp(beta * age);
	return Math.min(1.0, qx);
}

/**
 * Calculates probability of surviving N years from now.
 */
export function getProbSurvivingNYears(age: number, gender: 'male' | 'female', n: number): number {
	let cumulativeProb = 1.0;
	for (let i = 0; i < n; i++) {
		const qx = getMortalityRate(age + i, gender);
		cumulativeProb *= (1 - qx);
		if (cumulativeProb < 0.0001) return 0;
	}
	return cumulativeProb;
}

/**
 * Calculates the Joint Probability of survival for a group.
 * P(at least one alive) = 1 - P(all dead)
 */
export function getJointSurvivalProb(people: { age: number; gender: 'male' | 'female' }[], n: number): number {
	if (people.length === 0) return 0;
	let probAllDead = 1.0;
	for (const p of people) {
		const probAlive = getProbSurvivingNYears(p.age, p.gender, n);
		probAllDead *= (1 - probAlive);
	}
	return 1 - probAllDead;
}

/**
 * Finds the age/year where the survival probability hits a target (e.g. 5% chance of being alive).
 */
export function calculateTargetHorizon(people: { age: number; gender: 'male' | 'female' }[], targetProb: number): number {
	if (people.length === 0) return 30;
	
	// We check up to 120 years of age
	const currentMaxAge = Math.max(...people.map(p => p.age));
	const maxYears = 120 - currentMaxAge;

	for (let n = 1; n < maxYears; n++) {
		const jointProb = getJointSurvivalProb(people, n);
		if (jointProb < targetProb) {
			return n;
		}
	}
	return maxYears;
}

/**
 * Conservatism margin (0.0 to 1.0) maps to a target survival probability.
 * 0.0 (aggressive) = 50% chance of survival (median LE)
 * 1.0 (conservative) = 5% chance of survival (plan for very long life)
 */
export function getTargetProbFromMargin(margin: number): number {
	const minProb = 0.50; // Median
	const maxProb = 0.05; // 95th percentile
	// We use a non-linear mapping to make the slider feel more natural
	// Higher margin = lower probability of survival target = longer planning horizon
	return minProb - (margin * (minProb - maxProb));
}
