<script lang="ts">
	import { registry } from '$lib';
	import { goto } from '$app/navigation';
	import { formatCurrency } from '$lib/shared/financial';
	import { exportAllData, importAllData } from '$lib/shared/persistence';
	
	const allModules = registry.getAllModules();
	const enabledModules = registry.getEnabledModules();
	const enabledMap = registry.getEnabledMap();

	function manageModule(id: string) {
		registry.setActive(id);
		goto('/design');
	}

	async function handleImport(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const text = await file.text();
		if (importAllData(text)) {
			window.location.reload();
		}
	}

	function toggleModule(id: string) {
		registry.toggleModule(id);
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
			{ label: 'Safe Assets', val: summary.safeAssets, color: 'bg-indigo-600' },
			{ label: 'Passive Income', val: summary.passive, color: 'bg-emerald-500' },
			{ label: 'Portfolio Sales', val: summary.sales, color: 'bg-blue-500' }
		].filter(d => d.val > 0.01); // Filter out tiny/zero values
	});
</script>

<div class="space-y-12">
	<!-- Integrated Summary Section -->
	<section class="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
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
					<button onclick={() => manageModule('smart-withdrawals')} class="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg">Optimize Spending</button>
					<button onclick={() => manageModule('tips-ladder')} class="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">Adjust TIPS Floor</button>
				</div>

				<div class="pt-6 border-t border-slate-100 flex items-center space-x-6">
					<button onclick={exportAllData} class="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
						Save All Data (.json)
					</button>
					
					<label class="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
						Load Configuration
						<input type="file" accept=".json" onchange={handleImport} class="hidden" />
					</label>
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

	<!-- Module Management Gallery -->
	<section class="space-y-6">
		<h2 class="font-serif text-2xl font-bold text-slate-900 px-2">Module Gallery</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each $allModules as m}
				{@const isEnabled = $enabledMap[m.id]}
				{@const Icon = m.ui.Icon}
				{@const Dashboard = m.ui.Dashboard}
				<div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all flex flex-col justify-between {isEnabled ? 'ring-2 ring-emerald-500/20' : 'opacity-60 grayscale'}">
					<div>
						<div class="flex items-center justify-between mb-4">
							<div class="flex items-center space-x-3">
								<div class="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
									<Icon />
								</div>
								<h3 class="text-lg font-bold text-slate-900">{m.name}</h3>
							</div>
							
							<button 
								onclick={() => toggleModule(m.id)}
								class="w-10 h-6 rounded-full transition-colors relative { isEnabled ? 'bg-emerald-500' : 'bg-slate-200' }"
							>
								<div class="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform {isEnabled ? 'translate-x-4' : 'translate-x-0'}"></div>
							</button>
						</div>
						
						<p class="text-xs text-slate-500 leading-relaxed mb-6 h-10 line-clamp-2">{m.description}</p>
						
						{#if isEnabled}
							<div class="mb-6 py-4 border-t border-slate-50">
								<Dashboard />
							</div>
						{/if}
					</div>

					{#if isEnabled}
						<button 
							onclick={() => manageModule(m.id)}
							class="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold text-xs uppercase tracking-widest"
						>
							Manage Module
						</button>
					{:else}
						<div class="w-full py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 rounded-xl">
							Module Disabled
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>
</div>
