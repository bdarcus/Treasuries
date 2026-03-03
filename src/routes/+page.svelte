<script lang="ts">
	import { registry } from '$lib';
	import { goto } from '$app/navigation';
	import { formatCurrency } from '$lib/shared/financial';
	
	const modules = registry.getAllModules();

	function manageModule(id: string) {
		registry.setActive(id);
		goto('/design');
	}

	// Aggregate data for the unified summary
	let summary = $derived.by(() => {
		const smartMod = registry.getModule('smart-withdrawals');
		if (!smartMod) return null;
		
		const calc = smartMod.engine.calculate({});
		return {
			monthlyTotal: calc.totalSpending / 12,
			safeAssets: calc.safeAssets / 12,
			passive: calc.passiveIncome / 12,
			sales: calc.portfolioSales / 12,
			horizon: calc.yearsRemaining
		};
	});

	let chartData = $derived.by(() => {
		if (!summary) return [];
		return [
			{ label: 'Safe Assets', val: summary.safeAssets, color: 'bg-slate-900' },
			{ label: 'Passive Income', val: summary.passive, color: 'bg-emerald-500' },
			{ label: 'Portfolio Sales', val: summary.sales, color: 'bg-blue-500' }
		].filter(d => d.val > 0);
	});
</script>

<div class="space-y-12">
	<!-- Integrated Summary Section -->
	<section class="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
		<div class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none hidden lg:block">
			<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
			<div class="lg:col-span-5 space-y-6">
				<div class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
					Integrated Retirement Summary
				</div>
				<h1 class="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight">
					Your safe monthly spend is <span class="text-emerald-600">{formatCurrency(summary?.monthlyTotal || 0)}</span>
				</h1>
				<p class="text-slate-500 text-lg leading-relaxed max-w-md">
					Based on your current TIPS ladder, asset allocation, and life expectancy ({Math.round(summary?.horizon || 0)} years).
				</p>
				
				<div class="pt-4 flex flex-wrap gap-4">
					<button onclick={() => manageModule('smart-withdrawals')} class="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg">Adjust Plan</button>
					<button onclick={() => manageModule('tips-ladder')} class="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">Refine Ladder</button>
				</div>
			</div>

			<div class="lg:col-span-7">
				<div class="space-y-8">
					<!-- Unified Visual Graph -->
					<div class="h-16 flex rounded-2xl overflow-hidden shadow-inner bg-slate-50 p-1">
						{#each chartData as item}
							<div 
								class="{item.color} h-full first:rounded-l-xl last:rounded-r-xl transition-all hover:brightness-110 relative group"
								style="width: {(item.val / (summary?.monthlyTotal || 1)) * 100}%"
							>
								<div class="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white p-2 rounded text-[10px] whitespace-nowrap z-50 shadow-xl">
									{item.label}: {formatCurrency(item.val)}
								</div>
							</div>
						{/each}
					</div>

					<!-- Legend & Breakdown -->
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
						{#each chartData as item}
							<div class="space-y-1">
								<div class="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
									<span class="w-2 h-2 {item.color} rounded-full mr-2"></span>
									{item.label}
								</div>
								<div class="text-xl font-serif font-bold text-slate-900">{formatCurrency(item.val)}</div>
								<div class="text-[10px] text-slate-400 font-bold">{Math.round((item.val / (summary?.monthlyTotal || 1)) * 100)}% of total</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Module Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each modules as m}
			<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
				<div>
					<div class="flex items-center space-x-3 mb-4">
						<div class="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
							<svelte:component this={m.ui.Icon} />
						</div>
						<h2 class="text-lg font-bold text-slate-900">{m.name}</h2>
					</div>
					
					<div class="mb-6">
						<svelte:component this={m.ui.Dashboard} />
					</div>
				</div>

				<button 
					onclick={() => manageModule(m.id)}
					class="w-full py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-bold text-xs uppercase tracking-widest"
				>
					Manage {m.name}
				</button>
			</div>
		{/each}
	</div>
</div>
