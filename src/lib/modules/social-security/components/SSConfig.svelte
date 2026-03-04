<script lang="ts">
	import { ssStore } from '../store/ss';
	import { formatCurrency } from '../../../shared/financial';
	import { planningStore } from '../../../shared/planning';

	let state = $derived($ssStore);
	let person = $derived($planningStore.people[0]);

	function updateBenefit(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		ssStore.update(s => ({ ...s, annualBenefit: val }));
	}

	function updateAge(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		ssStore.update(s => ({ ...s, claimingAge: val }));
	}

	let saved = $state(false);
	function handleSave() {
		ssStore.save(state);
		saved = true;
		setTimeout(() => saved = false, 2000);
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
	<aside class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
		<h2 class="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">Benefit Parameters</h2>

		<div class="space-y-4">
			<div class="space-y-2">
				<label for="benefit" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Annual Benefit ($ Real)</label>
				<input type="number" id="benefit" value={state.annualBenefit} oninput={updateBenefit} 
					class="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-lg font-bold" />
			</div>

			<div class="space-y-2">
				<label for="age" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Claiming Age (Current: {person?.age || 0})</label>
				<div class="flex items-center space-x-4">
					<input type="range" id="age" min="62" max="70" step="1" value={state.claimingAge} oninput={updateAge}
						class="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
					<span class="font-mono font-bold text-blue-600 w-8 text-right">{state.claimingAge}</span>
				</div>
			</div>
		</div>

		<div class="pt-6 border-t border-slate-100">
			<div class="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
				<div class="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Estimated Monthly</div>
				<div class="font-serif text-3xl font-bold">{formatCurrency(state.annualBenefit / 12)}</div>
				<p class="text-[10px] text-slate-400 mt-2">Inflation-protected real income.</p>
			</div>
		</div>

		<button 
			onclick={handleSave}
			class="w-full py-4 {saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
		>
			{#if saved}
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
				<span>Saved!</span>
			{:else}
				<span>Save Configuration</span>
			{/if}
		</button>
	</aside>

	<section class="lg:col-span-8 space-y-8">
		<div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
			<h3 class="font-serif text-xl font-bold mb-4">Social Security & Inflation</h3>
			<p class="text-sm text-slate-600 leading-relaxed mb-6">
				Social Security is one of the few retirement income sources that is fully indexed to the Consumer Price Index (CPI-U). Because it is a <strong>real annuity</strong>, it perfectly complements a TIPS ladder. 
			</p>
			<div class="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-blue-800 text-sm italic">
				"Claiming at age 70 instead of 62 can increase your real monthly benefit by approximately 76%."
			</div>
		</div>
	</section>
</div>
