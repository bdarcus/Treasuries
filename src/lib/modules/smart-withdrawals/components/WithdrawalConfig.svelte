<script lang="ts">
	import { planningStore, planningHorizon } from '../../../shared/planning';
	import { registry } from '../../../core/registry';
	import { formatCurrency } from '../../../shared/financial';

	let state = $derived($planningStore);
	let horizon = $derived($planningHorizon);

	function updateAge(idx: number, e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		planningStore.update(s => {
			const people = [...s.people];
			people[idx].age = val;
			return { ...s, people };
		});
	}

	function updateConservatism(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value) / 100;
		planningStore.update(s => ({ ...s, conservatismMargin: val }));
	}

	// Dynamic calculation for display
	let result = $derived.by(() => {
		// Explicitly reference stores to establish Svelte 5 reactive dependencies
		const _s = $planningStore;
		const _h = $planningHorizon;
		
		const smartMod = registry.getModule('smart-withdrawals');
		if (!smartMod) return null;
		return smartMod.engine.calculate({});
	});

	let saved = $state(false);

	function handleSave() {
		planningStore.save(state);
		saved = true;
		setTimeout(() => saved = false, 2000);
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
	<aside class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
		<h2 class="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">Personal Factors</h2>

		<div class="space-y-6">
			{#each state.people as person, i}
				<div class="space-y-2">
					<label for="age-{i}" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Person {i+1} Age</label>
					<input type="number" id="age-{i}" value={person.age} oninput={(e) => updateAge(i, e)}
						class="w-full rounded-lg border-slate-200 focus:border-green-500 focus:ring-green-500" />
				</div>
			{/each}

			<div class="space-y-2">
				<label for="conservatism" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Conservatism Margin (%)</label>
				<div class="flex items-center space-x-4">
					<input type="range" id="conservatism" min="0" max="100" step="5" value={state.conservatismMargin * 100} oninput={updateConservatism}
						class="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-green-600" />
					<span class="font-mono font-bold text-green-600 w-12 text-right">{Math.round(state.conservatismMargin * 100)}%</span>
				</div>
				<p class="text-[10px] text-slate-400 mt-1 italic">Higher margin extends the planning horizon.</p>
			</div>
		</div>

		<button 
			onclick={handleSave}
			class="w-full py-4 {saved ? 'bg-emerald-600' : 'bg-green-600 hover:bg-green-500'} text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
		>
			{#if saved}
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
				<span>Plan Saved!</span>
			{:else}
				<span>Save Withdrawal Plan</span>
			{/if}
		</button>
	</aside>

	<section class="lg:col-span-8 space-y-8">
		<div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
			<h3 class="font-serif text-xl font-bold mb-6">Merton Dynamic Spending</h3>
			<p class="text-slate-600 text-sm leading-relaxed mb-8">
				This calculation combines your <strong>TIPS Floor</strong> with the <strong>Portfolio Surplus</strong>, 
				amortized over a <strong>{horizon.yearsRemaining.toFixed(1)} year</strong> planning horizon (based on your joint life expectancy and conservatism).
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div class="p-6 bg-slate-50 rounded-2xl border border-slate-100">
					<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Guaranteed Floor</div>
					<div class="text-2xl font-bold text-slate-900">{formatCurrency(result?.floor || 0)}</div>
					<div class="text-[10px] text-slate-400 mt-1">From TIPS Ladder Module</div>
				</div>
				<div class="p-6 bg-slate-50 rounded-2xl border border-slate-100">
					<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Portfolio Upside</div>
					<div class="text-2xl font-bold text-blue-600">{formatCurrency(result?.upside || 0)}</div>
					<div class="text-[10px] text-slate-400 mt-1">From Amortized Surplus</div>
				</div>
			</div>

			<div class="flex items-center justify-center py-12 bg-green-50 rounded-2xl border border-green-100">
				<div class="text-center">
					<div class="text-[10px] font-black uppercase tracking-[0.2em] text-green-400 mb-2">Safe Monthly Spending</div>
					<div class="text-6xl font-serif font-bold text-green-900">
						{formatCurrency((result?.totalSpending || 0) / 12)}
					</div>
					<div class="text-xs font-bold text-green-600 mt-2 uppercase tracking-widest">Adjusts with market performance</div>
				</div>
			</div>
		</div>
	</section>
</div>
