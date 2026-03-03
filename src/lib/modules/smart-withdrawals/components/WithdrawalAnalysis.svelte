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
			safeAssets: result.safeAssets,
			passiveIncome: result.passiveIncome,
			portfolioSales: result.portfolioSales,
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
		<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
			<h3 class="font-serif text-xl font-bold">Projected Annual Spending (Real $)</h3>
			<div class="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
				<div class="flex items-center"><span class="w-3 h-3 bg-slate-900 rounded-full mr-2"></span> Safe Assets (TIPS)</div>
				<div class="flex items-center"><span class="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span> Passive Income</div>
				<div class="flex items-center"><span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span> Portfolio Sales</div>
			</div>
		</div>
		
		<div class="relative h-64 flex items-end gap-1 border-b border-slate-100 pb-2">
			{#if years.length === 0}
				<div class="absolute inset-0 flex items-center justify-center text-slate-300 italic">No projection data</div>
			{:else}
				{@const maxSpending = Math.max(...years.map(y => y.total)) * 1.2}
				{#each years as y, i}
					<div class="flex-1 group relative flex flex-col justify-end h-full">
						<!-- Portfolio Sales -->
						<div class="bg-blue-500 w-full opacity-80 group-hover:opacity-100 transition-opacity" 
							style="height: {(y.portfolioSales / maxSpending) * 100}%"></div>
						<!-- Passive Income -->
						<div class="bg-emerald-500 w-full border-t border-white/10" 
							style="height: {(y.passiveIncome / maxSpending) * 100}%"></div>
						<!-- Safe Assets -->
						<div class="bg-slate-900 w-full border-t border-white/10" 
							style="height: {(y.safeAssets / maxSpending) * 100}%"></div>
						
						{#if i % 5 === 0 || i === years.length - 1}
							<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400">
								{y.year}
							</div>
						{/if}
						
						<div class="absolute -top-28 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white p-3 rounded-lg text-[10px] whitespace-nowrap z-10 shadow-xl border border-white/10">
							<div class="font-bold mb-2 border-b border-white/20 pb-1">{y.year} Spending Breakdown</div>
							<div class="space-y-1">
								<div class="flex justify-between gap-8"><span>Safe Assets:</span> <span class="font-mono">{formatCurrency(y.safeAssets)}</span></div>
								<div class="flex justify-between gap-8"><span>Passive Income:</span> <span class="font-mono text-emerald-400">{formatCurrency(y.passiveIncome)}</span></div>
								<div class="flex justify-between gap-8"><span>Portfolio Sales:</span> <span class="font-mono text-blue-400">{formatCurrency(y.portfolioSales)}</span></div>
							</div>
							<div class="border-t border-white/20 mt-2 pt-1 font-bold text-green-400 flex justify-between">
								<span>Total:</span> <span>{formatCurrency(y.total)}</span>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
			<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Monthly Safe Spend</div>
			<div class="text-3xl font-serif font-bold text-slate-900">{formatCurrency((result?.totalSpending || 0) / 12)}</div>
			<p class="text-[10px] text-slate-400 mt-1 italic">Total combined real income.</p>
		</div>
		
		<div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
			<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Monthly Safe Assets</div>
			<div class="text-xl font-bold text-slate-700">{formatCurrency((result?.safeAssets || 0) / 12)}</div>
			<p class="text-[10px] text-slate-400 mt-1 italic">Guaranteed TIPS floor.</p>
		</div>

		<div class="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
			<div class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Monthly Passive</div>
			<div class="text-xl font-bold text-emerald-700">{formatCurrency((result?.passiveIncome || 0) / 12)}</div>
			<p class="text-[10px] text-emerald-500 mt-1 italic">Portfolio yield/dividends.</p>
		</div>

		<div class="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
			<div class="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Monthly Sales</div>
			<div class="text-xl font-bold text-blue-700">{formatCurrency((result?.portfolioSales || 0) / 12)}</div>
			<p class="text-[10px] text-blue-500 mt-1 italic">Required principal liquidation.</p>
		</div>
	</div>
</div>
