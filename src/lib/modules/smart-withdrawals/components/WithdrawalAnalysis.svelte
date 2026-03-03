<script lang="ts">
	import { planningStore, planningHorizon } from '../../../shared/planning';
	import { registry } from '../../../core/registry';
	import { formatCurrency } from '../../../shared/financial';

	let state = $derived($planningStore);
	let horizon = $derived($planningHorizon);

	let result = $derived.by(() => {
		// Reactive dependencies
		const _s = $planningStore;
		const _h = $planningHorizon;

		const mod = registry.getModule('smart-withdrawals');
		return mod?.engine.calculate({});
	});

	let years = $derived.by(() => {
		if (!result) return [];
		const startYear = new Date().getFullYear();
		return Array.from({ length: Math.ceil(result.yearsRemaining) }, (_, i) => ({
			year: startYear + i,
			floor: result.floor,
			upside: result.upside,
			total: result.totalSpending
		}));
	});
</script>

<div class="space-y-8">
	<header>
		<h1 class="font-serif text-4xl font-bold text-slate-900">Retirement Spending Plan</h1>
		<p class="text-slate-500 mt-2">Combined safe withdrawal rate based on floor-and-upside logic.</p>
	</header>

	<div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
		<div class="flex justify-between items-center mb-8">
			<h3 class="font-serif text-xl font-bold">Projected Annual Spending (Real $)</h3>
			<div class="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
				<div class="flex items-center"><span class="w-3 h-3 bg-slate-900 rounded-full mr-2"></span> TIPS Floor</div>
				<div class="flex items-center"><span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span> Portfolio Upside</div>
			</div>
		</div>
		
		<div class="relative h-64 flex items-end gap-1 border-b border-slate-100 pb-2">
			{#if years.length === 0}
				<div class="absolute inset-0 flex items-center justify-center text-slate-300 italic">No projection data</div>
			{:else}
				{@const maxSpending = Math.max(...years.map(y => y.total)) * 1.2}
				{#each years as y, i}
					<div class="flex-1 group relative flex flex-col justify-end h-full">
						<!-- Portfolio Portion -->
						<div class="bg-blue-500 w-full opacity-80 group-hover:opacity-100 transition-opacity" 
							style="height: {(y.upside / maxSpending) * 100}%"></div>
						<!-- TIPS Portion -->
						<div class="bg-slate-900 w-full border-t border-white/10" 
							style="height: {(y.floor / maxSpending) * 100}%"></div>
						
						{#if i % 5 === 0 || i === years.length - 1}
							<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400">
								{y.year}
							</div>
						{/if}
						
						<div class="absolute -top-20 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white p-3 rounded-lg text-[10px] whitespace-nowrap z-10 shadow-xl">
							<div class="font-bold mb-1">{y.year} Spending</div>
							<div class="flex justify-between gap-4"><span>Floor:</span> <span>{formatCurrency(y.floor)}</span></div>
							<div class="flex justify-between gap-4"><span>Upside:</span> <span>{formatCurrency(y.upside)}</span></div>
							<div class="border-t border-white/20 mt-1 pt-1 font-bold text-green-400">
								Total: {formatCurrency(y.total)}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
			<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target Survival</div>
			<div class="text-2xl font-bold text-slate-900">{Math.round((1 - (result?.targetProb || 0.5)) * 100)}%</div>
			<p class="text-[10px] text-slate-400 mt-1 italic">Confidence in not outliving assets.</p>
		</div>
		<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
			<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Horizon Year</div>
			<div class="text-2xl font-bold text-slate-900">{result?.horizonYear || 'N/A'}</div>
			<p class="text-[10px] text-slate-400 mt-1 italic">Planning horizon endpoint.</p>
		</div>
		<div class="bg-white p-6 rounded-2xl border border-emerald-500/30 shadow-sm shadow-emerald-50">
			<div class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Monthly Safe Spend</div>
			<div class="text-2xl font-bold text-emerald-600">{formatCurrency((result?.totalSpending || 0) / 12)}</div>
			<p class="text-[10px] text-emerald-500 mt-1 italic">Your dynamic real income.</p>
		</div>
	</div>
</div>
