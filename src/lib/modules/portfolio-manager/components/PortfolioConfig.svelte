<script lang="ts">
	import { portfolioStore, expectedRealReturn } from '../store/portfolio';
	import { formatCurrency } from '../../../shared/financial';

	import { registry } from '../../../core/registry';

	let state = $derived($portfolioStore);
	let realReturn = $derived($expectedRealReturn);

	let calculated = $derived.by(() => {
		const mod = registry.getModule('portfolio-manager');
		return mod?.engine.calculate({});
	});

	let isHorizonSynced = $derived.by(() => {
		const withdrawalModule = registry.getModule('smart-withdrawals');
		return !!withdrawalModule;
	});

	function updateBalance(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		portfolioStore.update(s => ({ ...s, balance: val }));
	}

	function updateAllocation(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value) / 100;
		portfolioStore.update(s => ({ ...s, equityAllocation: val }));
	}

	function updateBequest(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value) || 0;
		portfolioStore.update(s => ({ ...s, bequestTarget: val }));
	}

	function updateRetirement(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		portfolioStore.update(s => ({ ...s, retirementYear: val }));
	}

	let saved = $state(false);

	function handleSave() {
		portfolioStore.save(state);
		saved = true;
		setTimeout(() => saved = false, 2000);
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
	<aside class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
		<h2 class="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">Portfolio Strategy</h2>

		<div class="space-y-4">
			<div class="space-y-2">
				<label for="balance" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Current Balance ($)</label>
				<input type="number" id="balance" value={state.balance} oninput={updateBalance} 
					class="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-lg font-bold" />
			</div>

			<div class="space-y-2">
				<label for="allocation" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Equity Allocation (%)</label>
				<div class="flex items-center space-x-4">
					<input type="range" id="allocation" min="0" max="100" step="5" value={state.equityAllocation * 100} oninput={updateAllocation}
						class="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
					<span class="font-mono font-bold text-blue-600 w-12 text-right">{Math.round(state.equityAllocation * 100)}%</span>
				</div>
				<p class="text-[10px] text-slate-400 mt-1 italic">Allocation serves as your primary risk proxy.</p>
			</div>

			<div class="space-y-2">
				<label for="bequest" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Bequest Target (Future $)</label>
				<input type="number" id="bequest" value={state.bequestTarget} oninput={updateBequest} 
					class="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm" />
				<p class="text-[10px] text-slate-400 mt-1 italic">Amount to leave behind at the end of the horizon.</p>
			</div>

			<div class="space-y-2">
				<label for="retirement" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">
					Horizon Year
					{#if isHorizonSynced}
						<span class="ml-2 text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">SYNCED WITH AGES</span>
					{/if}
				</label>
				<input type="number" id="retirement" value={calculated?.horizonYear} oninput={updateRetirement}
					disabled={isHorizonSynced}
					class="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400" />
				{#if isHorizonSynced}
					<p class="text-[9px] text-slate-400 italic">Adjust ages in Smart Withdrawal module to change this.</p>
				{/if}
			</div>
		</div>

		<div class="pt-6 border-t border-slate-100">
			<div class="bg-slate-900 text-white rounded-xl p-6 shadow-lg space-y-4">
				<div>
					<div class="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Expected Real Return</div>
					<div class="font-serif text-3xl font-bold">{(realReturn * 100).toFixed(2)}%</div>
				</div>
				<p class="text-[10px] text-slate-400 leading-relaxed">Based on Elm Wealth market assumptions for Equities and TIPS.</p>
			</div>
		</div>

		<button 
			onclick={handleSave}
			class="w-full py-4 {saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
		>
			{#if saved}
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
				<span>Plan Saved!</span>
			{:else}
				<span>Save Portfolio Plan</span>
			{/if}
		</button>
	</aside>

	<section class="lg:col-span-8 space-y-8">
		<div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
			<h3 class="font-serif text-xl font-bold mb-6">Merton Constant Amortization</h3>
			<p class="text-slate-600 text-sm leading-relaxed mb-8">
				In the Merton model, your portfolio is treated as a self-amortizing asset that preserves your bequest. 
				Given your current balance of <strong>{formatCurrency(state.balance)}</strong>, a real return of <strong>{(realReturn * 100).toFixed(1)}%</strong>, 
				and a target bequest of <strong>{formatCurrency(state.bequestTarget)}</strong>, this portfolio can sustainably generate a real income of:
			</p>

			<div class="flex items-center justify-center py-12 bg-blue-50 rounded-2xl border border-blue-100">
				<div class="text-center">
					<div class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Sustainable Real Income</div>
					<div class="text-5xl font-serif font-bold text-blue-900">
						{formatCurrency((state.balance * realReturn) / (1 - Math.pow(1 + realReturn, -(state.retirementYear - new Date().getFullYear()))))}
					</div>
					<div class="text-xs font-bold text-blue-600 mt-2 uppercase tracking-widest">per year (inflation adjusted)</div>
				</div>
			</div>
		</div>
	</section>
</div>
