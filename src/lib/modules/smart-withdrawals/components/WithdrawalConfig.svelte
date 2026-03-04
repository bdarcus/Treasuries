<script lang="ts">
	import { planningStore, planningHorizon } from '../../../shared/planning';
	import { formatCurrency } from '../../../shared/financial';
	import { registry } from '../../../core/registry';

	let state = $derived($planningStore);
	let horizon = $derived($planningHorizon);

	let calculated = $derived.by(() => {
		// Explicitly reference stores to establish Svelte 5 reactive dependencies
		const _s = $planningStore;
		const _h = $planningHorizon;

		const mod = registry.getModule('smart-withdrawals');
		return mod?.engine.calculate({});
	});

	function updateAge(index: number, age: number) {
		planningStore.update(s => {
			const people = [...s.people];
			people[index] = { ...people[index], age };
			return { ...s, people };
		});
	}

	function updateGender(index: number, gender: 'male' | 'female') {
		planningStore.update(s => {
			const people = [...s.people];
			people[index] = { ...people[index], gender };
			return { ...s, people };
		});
	}

	function updateMargin(margin: number) {
		planningStore.update(s => ({ ...s, conservatismMargin: margin }));
	}

	let saved = $state(false);
	function handleSave() {
		planningStore.save(state);
		saved = true;
		setTimeout(() => saved = false, 2000);
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
	<aside class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
		<h2 class="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">Planning Parameters</h2>

		<div class="space-y-6">
			{#each state.people as person, i}
				<div class="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
					<div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Person {i + 1}</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1">
							<label for="age-{i}" class="block text-[10px] font-bold text-slate-500 uppercase">Age</label>
							<input type="number" id="age-{i}" value={person.age} oninput={(e) => updateAge(i, parseInt((e.target as HTMLInputElement).value))}
								class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 font-bold" />
						</div>
						<div class="space-y-1">
							<label for="gender-{i}" class="block text-[10px] font-bold text-slate-500 uppercase">Gender</label>
							<select id="gender-{i}" value={person.gender} onchange={(e) => updateGender(i, (e.target as HTMLSelectElement).value as any)}
								class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm">
								<option value="male">Male</option>
								<option value="female">Female</option>
							</select>
						</div>
					</div>
				</div>
			{/each}

			<div class="space-y-3 pt-2">
				<div class="flex justify-between items-center">
					<label for="margin" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Conservatism Margin</label>
					<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">PROB: {Math.round(horizon.targetProb * 100)}%</span>
				</div>
				<input type="range" id="margin" min="0" max="1" step="0.05" value={state.conservatismMargin} oninput={(e) => updateMargin(parseFloat((e.target as HTMLInputElement).value))}
					class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
				<div class="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
					<span>Median LE</span>
					<span>95th Percentile</span>
				</div>
			</div>
		</div>

		<div class="pt-6 border-t border-slate-100">
			<div class="bg-slate-900 text-white rounded-xl p-6 shadow-lg space-y-4">
				<div>
					<div class="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Planning Horizon</div>
					<div class="font-serif text-3xl font-bold">{Math.round(horizon.yearsRemaining)} Years</div>
					<div class="text-[10px] text-slate-400 mt-1">Targeting age of 100+ survival.</div>
				</div>
			</div>
		</div>

		<button 
			onclick={handleSave}
			class="w-full py-4 {saved ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'} text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
		>
			{#if saved}
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
				<span>Plan Saved!</span>
			{:else}
				<span>Save Planning State</span>
			{/if}
		</button>
	</aside>

	<section class="lg:col-span-8 space-y-8">
		<div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
			<h3 class="font-serif text-xl font-bold mb-6">Safe Spending Summary</h3>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
				<div class="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
					<div class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Monthly Safe Spend</div>
					<div class="text-4xl font-serif font-bold text-emerald-900">{formatCurrency((calculated?.totalSpending || 0) / 12)}</div>
					<p class="text-xs text-emerald-700/70 mt-2 leading-relaxed">Integrated real income from all enabled modules.</p>
				</div>

				<div class="p-6 bg-slate-50 rounded-2xl border border-slate-200">
					<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Horizon End Year</div>
					<div class="text-4xl font-serif font-bold text-slate-900">{horizon.horizonYear}</div>
					<p class="text-xs text-slate-500 mt-2 leading-relaxed">Based on your {Math.round(horizon.targetProb * 100)}% survival target.</p>
				</div>
			</div>

			<div class="space-y-4">
				<h4 class="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Income Breakdown</h4>
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div class="space-y-1">
						<div class="text-[10px] font-bold text-slate-500 uppercase">Safe Assets</div>
						<div class="text-lg font-bold text-slate-900">{formatCurrency((calculated?.safeAssets || 0) / 12)}</div>
					</div>
					<div class="space-y-1">
						<div class="text-[10px] font-bold text-slate-500 uppercase">Passive Yield</div>
						<div class="text-lg font-bold text-emerald-600">{formatCurrency((calculated?.passiveIncome || 0) / 12)}</div>
					</div>
					<div class="space-y-1">
						<div class="text-[10px] font-bold text-slate-500 uppercase">Principal Sales</div>
						<div class="text-lg font-bold text-blue-600">{formatCurrency((calculated?.portfolioSales || 0) / 12)}</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
