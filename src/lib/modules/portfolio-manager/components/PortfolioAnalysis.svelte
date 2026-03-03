<script lang="ts">
	import { portfolioStore, expectedRealReturn } from '../store/portfolio';
	import { planningHorizon } from '../../../shared/planning';
	import { registry } from '../../../core/registry';
	import { formatCurrency } from '../../../shared/financial';
	import { onMount } from 'svelte';

	let state = $derived($portfolioStore);
	let realRate = $derived($expectedRealReturn);

	let projection = $derived.by(() => {
		// Reactive dependencies
		const _s = $portfolioStore;
		const _h = $planningHorizon;
		const _r = $expectedRealReturn;

		const mod = registry.getModule('portfolio-manager');
		return mod?.engine.project(state);
	});

	onMount(() => {
		portfolioStore.fetchAssumptions();
	});
</script>

<div class="space-y-8">
	<header>
		<h1 class="font-serif text-4xl font-bold text-slate-900">Portfolio Projection</h1>
		<p class="text-slate-500 mt-2">Amortizing {formatCurrency(state.balance)} over {state.retirementYear - new Date().getFullYear()} years.</p>
	</header>

	<div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
		<h3 class="font-serif text-xl font-bold mb-8">Balance Depletion Forecast (Real $)</h3>
		
		<div class="relative h-64 flex items-end gap-1 border-b border-slate-100 pb-2">
			{#if !projection || projection.values.length === 0}
				<div class="absolute inset-0 flex items-center justify-center text-slate-300 italic">No projection data</div>
			{:else}
				{#each projection.values as val, i}
					{@const height = (val / projection.values[0]) * 100}
					<div class="flex-1 group relative flex flex-col justify-end h-full">
						<div class="bg-blue-500 w-full rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity" style="height: {height}%"></div>
						{#if i % 5 === 0 || i === projection.values.length - 1}
							<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400">
								{projection.years[i]}
							</div>
						{/if}
						
						<div class="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white p-2 rounded text-[10px] whitespace-nowrap z-10 shadow-xl">
							{projection.years[i]}: {formatCurrency(val)}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
			<h4 class="font-bold text-slate-900 mb-4">Assumptions Layer</h4>
			<div class="space-y-4">
				<div class="flex justify-between text-sm">
					<span class="text-slate-500">Nominal Equity Return</span>
					<span class="font-mono font-bold">{(state.marketAssumptions.equityReturn * 100).toFixed(1)}%</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-slate-500">Real TIPS Return</span>
					<span class="font-mono font-bold">{(state.marketAssumptions.tipsReturn * 100).toFixed(1)}%</span>
				</div>
				<div class="flex justify-between text-sm border-t pt-4">
					<span class="text-slate-900 font-bold">Expected Portfolio Real Return</span>
					<span class="font-mono font-bold text-blue-600">{(realRate * 100).toFixed(2)}%</span>
				</div>
			</div>
		</div>

		<div class="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 flex flex-col justify-center">
			<div class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Merton Insight</div>
			<p class="text-sm leading-relaxed italic opacity-95">
				"A constant real amortization strategy ensures that you consume your portfolio surplus evenly over your planning horizon, regardless of short-term volatility."
			</p>
		</div>
	</div>
</div>
