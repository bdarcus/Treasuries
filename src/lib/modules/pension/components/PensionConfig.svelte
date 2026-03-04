<script lang="ts">
	import { pensionStore } from '../store/pension';
	import { formatCurrency } from '../../../shared/financial';

	let state = $derived($pensionStore);

	function updateAmount(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		pensionStore.update(s => ({ ...s, amount: val }));
	}

	function updateStartYear(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		pensionStore.update(s => ({ ...s, startYear: val }));
	}

	function updateCola(e: Event) {
		const val = (e.target as HTMLSelectElement).value as any;
		pensionStore.update(s => ({ ...s, colaType: val }));
	}

	let saved = $state(false);
	function handleSave() {
		pensionStore.save(state);
		saved = true;
		setTimeout(() => saved = false, 2000);
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
	<aside class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
		<h2 class="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">Pension Parameters</h2>

		<div class="space-y-4">
			<div class="space-y-2">
				<label for="amount" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Monthly Amount ($)</label>
				<input type="number" id="amount" value={state.amount} oninput={updateAmount} 
					class="w-full rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-lg font-bold" />
			</div>

			<div class="space-y-2">
				<label for="start" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Start Year</label>
				<input type="number" id="start" value={state.startYear} oninput={updateStartYear} 
					class="w-full rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
			</div>

			<div class="space-y-2">
				<label for="cola" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Cost of Living Adj. (COLA)</label>
				<select id="cola" value={state.colaType} onchange={updateCola} class="w-full rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm">
					<option value="None">None (Fixed Nominal)</option>
					<option value="CPI">CPI Linked (Real Annuity)</option>
					<option value="Fixed">Fixed % Increase</option>
				</select>
			</div>
		</div>

		<button 
			onclick={handleSave}
			class="w-full py-4 {saved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
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
			<h3 class="font-serif text-xl font-bold mb-4">The "Hidden Tax" of No COLA</h3>
			<p class="text-sm text-slate-600 leading-relaxed mb-6">
				If your pension has no COLA, its <strong>real purchasing power</strong> will be eroded by inflation every year. At 2.5% inflation, a $2,000 pension will only buy about $1,200 worth of goods after 20 years.
			</p>
			{#if state.colaType === 'None'}
				<div class="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-sm">
					⚠️ <strong>Warning:</strong> Your current settings show no inflation protection. We recommend ensuring your TIPS ladder or portfolio is sized to compensate for this future shortfall.
				</div>
			{/if}
		</div>
	</section>
</div>
