<script lang="ts">
	import { onMount } from 'svelte';
	import { runRebalance, toDateStr, localDate } from '$lib/engine/rebalance-engine.js';
	import { fetchMarketData, getRefCpi, type MarketData } from '$lib/engine/market-data';
	import { ladderStore } from '$lib/stores/ladder';
	import { exportToCsv } from '$lib/engine/export';

	let marketData = $state<MarketData | null>(null);
	let startYear = $state(new Date().getFullYear());
	let endYear = $state(new Date().getFullYear() + 9);
	let income = $state(10000);
	
	// Advanced Settings
	let strategy = $state<'Default'|'Cheapest'>('Default');
	let excludeCusipsStr = $state('');
	let customSettlementDate = $state('');
	let marginalTaxRate = $state(0);

	let results = $state<any>(null);
	let liveEstimate = $state<number | null>(null);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			marketData = await fetchMarketData();
			customSettlementDate = toDateStr(marketData.settlementDate);
		} catch (e) {
			error = "Failed to load market data.";
		}
	});

	function getSettlementDate() {
		return customSettlementDate ? localDate(customSettlementDate) : marketData!.settlementDate;
	}

	function getExcludeCusips() {
		return excludeCusipsStr.split(',').map(s => s.trim()).filter(Boolean);
	}

	function updateEstimate() {
		if (!marketData || income <= 0 || startYear <= 0 || endYear < startYear) {
			liveEstimate = null;
			return;
		}
		try {
			const sDate = getSettlementDate();
			const dateStr = toDateStr(sDate);
			const refCPI = getRefCpi(marketData.refCpiRows, dateStr);
			const res = runRebalance({
				dara: income,
				method: 'Full',
				holdings: [],
				tipsMap: marketData.tipsMap,
				refCPI: refCPI,
				settlementDate: sDate,
				startYear,
				endYear,
				excludeCusips: getExcludeCusips(),
				strategy,
				marginalTaxRate: marginalTaxRate / 100
			});
			liveEstimate = Math.abs(res.summary.costDeltaSum);
		} catch (e) {
			liveEstimate = null;
		}
	}

	function generate() {
		if (!marketData) return;
		try {
			error = null;
			const sDate = getSettlementDate();
			const dateStr = toDateStr(sDate);
			const refCPI = getRefCpi(marketData.refCpiRows, dateStr);
			results = runRebalance({
				dara: income,
				method: 'Full',
				holdings: [],
				tipsMap: marketData.tipsMap,
				refCPI: refCPI,
				settlementDate: sDate,
				startYear,
				endYear,
				excludeCusips: getExcludeCusips(),
				strategy,
				marginalTaxRate: marginalTaxRate / 100
			});

			// Save to store
			ladderStore.save({
				holdings: results.results.map((r: any) => ({ cusip: r[0], qty: r[8] })).filter((h: any) => h.qty > 0),
				target: { startYear, endYear, income },
				lastResults: results
			});
		} catch (e: any) {
			error = e.message;
		}
	}

	$effect(() => {
		if (startYear || endYear || income || strategy || excludeCusipsStr || customSettlementDate || marginalTaxRate !== undefined) {
			updateEstimate();
		}
	});
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
	<!-- Sidebar Inputs -->
	<aside class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
		<h2 class="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">Parameters</h2>

		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label for="start-year" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Start Year</label>
					<input type="number" id="start-year" bind:value={startYear} class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" />
				</div>
				<div class="space-y-2">
					<label for="end-year" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">End Year</label>
					<input type="number" id="end-year" bind:value={endYear} class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" />
				</div>
			</div>

			<div class="space-y-2">
				<label for="income" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Target Real Income ($)</label>
				<input type="number" id="income" bind:value={income} class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-lg font-bold" />
			</div>
		</div>

		<div class="pt-4 border-t border-slate-100 space-y-4">
			<h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Advanced Settings</h3>
			
			<div class="space-y-2">
				<label for="strategy" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Selection Strategy</label>
				<select id="strategy" bind:value={strategy} class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm">
					<option value="Default">Default (Smooth Cashflow)</option>
					<option value="Cheapest">Cheapest (Maximize Yield)</option>
				</select>
			</div>

			<div class="space-y-2">
				<div class="flex justify-between items-center">
					<label for="settlement" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Purchase Date (Settlement)</label>
					<div class="group relative">
						<span class="cursor-help text-emerald-600 text-[10px] font-bold">What is this?</span>
						<div class="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white p-3 rounded-lg text-[10px] w-48 z-50 leading-relaxed shadow-xl normal-case font-normal">
							The date you buy the bonds. This <strong>must</strong> align with the date the market prices were recorded (currently {marketData ? toDateStr(marketData.settlementDate) : '...'}) for the math to be accurate.
						</div>
					</div>
				</div>
				<input type="date" id="settlement" bind:value={customSettlementDate} class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm" />
			</div>

			<div class="space-y-2">
				<label for="tax" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Marginal Tax Rate (%)</label>
				<input type="number" id="tax" bind:value={marginalTaxRate} min="0" max="100" class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm" />
			</div>

			<div class="space-y-2">
				<label for="exclude" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Exclude CUSIPs</label>
				<input type="text" id="exclude" bind:value={excludeCusipsStr} placeholder="e.g. 91282CDX6" class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm font-mono" />
			</div>
		</div>

		{#if liveEstimate !== null}
			<div class="bg-slate-900 text-white rounded-xl p-6 text-center shadow-lg">
				<div class="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Estimated Investment</div>
				<div class="font-serif text-4xl font-bold">${Math.round(liveEstimate).toLocaleString()}</div>
				<p class="text-[10px] text-slate-400 mt-4 leading-relaxed">Based on current Treasury rates and RefCPI {marketData?.refCpiRows[0]?.refCpi}.</p>
			</div>
		{/if}

		<button 
			onclick={generate}
			class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
		>
			Generate Trade Ticket
		</button>

		{#if error}
			<div class="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
				⚠️ {error}
			</div>
		{/if}
	</aside>

	<!-- Results Area -->
	<section class="lg:col-span-8 space-y-8">
		{#if !results}
			<div class="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
				<div class="text-4xl mb-4">📜</div>
				<h3 class="font-serif text-2xl font-bold text-slate-900 mb-2">Configure your ladder.</h3>
				<p class="text-slate-500 max-w-sm mx-auto">Enter your goals on the left to generate a concrete shopping list of TIPS bonds.</p>
			</div>
		{:else}
			<!-- Summary Stats -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
					<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rungs Funded</div>
					<div class="font-serif text-3xl font-bold">{results.summary.rungCount} Years</div>
				</div>
				<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
					<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Issues</div>
					<div class="font-serif text-3xl font-bold">{results.results.length} Bonds</div>
				</div>
				<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
					<div class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">DARA Achieved</div>
					<div class="font-serif text-3xl font-bold">${Math.round(results.summary.DARA).toLocaleString()}</div>
				</div>
			</div>

			<!-- Gap Innovation Callout (if gaps exist) -->
			{#if results.summary.gapYears.length > 0}
				<div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
					<h4 class="text-emerald-800 font-bold mb-2 flex items-center">
						<span class="mr-2">💡</span> Gap Coverage Strategy Active
					</h4>
					<p class="text-sm text-emerald-700 leading-relaxed mb-4">
						Market data lacks TIPS for the years <strong>{results.summary.gapYears.join(', ')}</strong>. 
						The engine has used duration matching between the <strong>{results.summary.brackets.lowerYear}</strong> and <strong>{results.summary.brackets.upperYear}</strong> brackets to cover these income years.
					</p>
					<div class="flex gap-8 text-xs font-bold uppercase tracking-wider">
						<div class="text-emerald-600">
							{results.summary.brackets.lowerYear} Weight: {Math.round(results.summary.lowerWeight * 100)}%
						</div>
						<div class="text-emerald-600">
							{results.summary.brackets.upperYear} Weight: {Math.round(results.summary.upperWeight * 100)}%
						</div>
					</div>
				</div>
			{/if}

			<!-- Trade Ticket -->
			<div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
				<div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
					<h3 class="font-serif text-xl font-bold">Shopping List (Trade Ticket)</h3>
					<div class="flex gap-2">
						<button 
							onclick={() => {
								ladderStore.save({
									holdings: results.results.map((r: any) => ({ cusip: r[0], qty: r[8] })).filter((h: any) => h.qty > 0),
									target: { startYear, endYear, income },
									lastResults: results
								});
								window.location.href = '/track';
							}}
							class="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 uppercase tracking-widest transition-colors shadow-sm"
						>
							Commit to Portfolio & Track
						</button>
						<button 
							onclick={() => window.print()}
							class="print:hidden px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 uppercase tracking-widest transition-colors"
						>
							Print PDF
						</button>
						<button 
							onclick={() => exportToCsv('tips-ladder-design.csv', results.HDR, results.results)}
							class="print:hidden px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 uppercase tracking-widest transition-colors"
						>
							CSV Export
						</button>
					</div>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 print:bg-white print:text-black">
							<tr>
								<th class="px-6 py-4 border-b print:px-2">Maturity</th>
								<th class="px-6 py-4 border-b print:px-2">CUSIP</th>
								<th class="px-6 py-4 border-b print:px-2">Quantity</th>
								<th class="px-6 py-4 text-right border-b print:px-2">Est. Cost</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 print:divide-slate-300">
							{#each results.results as row}
								{#if row[8] > 0}
									<tr class="hover:bg-slate-50 transition-colors print:hover:bg-white">
										<td class="px-6 py-4 print:px-2">
											<div class="font-bold text-slate-900">{row[2]}</div>
											<div class="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter print:text-slate-500">Income for {row[3]}</div>
										</td>
										<td class="px-6 py-4 font-mono text-sm print:px-2">{row[0]}</td>
										<td class="px-6 py-4 font-bold text-slate-700 print:px-2">{row[8].toLocaleString()}</td>
										<td class="px-6 py-4 text-right font-serif font-bold text-lg print:px-2">${Math.round(row[10]).toLocaleString()}</td>
									</tr>
								{/if}
							{/each}
						</tbody>
						<tfoot class="bg-slate-900 text-white font-bold print:bg-white print:text-black print:border-t-2 print:border-black">
							<tr>
								<td colspan="3" class="px-6 py-6 text-right uppercase tracking-widest text-xs opacity-60 print:px-2 print:text-black print:opacity-100">Total Estimated Cost</td>
								<td class="px-6 py-6 text-right font-serif text-2xl text-emerald-400 print:px-2 print:text-black">${Math.round(Math.abs(results.summary.costDeltaSum)).toLocaleString()}</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		{/if}
	</section>
</div>

<style>
	@media print {
		:global(nav), aside, .print\:hidden {
			display: none !important;
		}
		:global(body) {
			background-color: white !important;
		}
		section {
			width: 100% !important;
			margin: 0 !important;
			padding: 0 !important;
		}
		.bg-white {
			box-shadow: none !important;
			border: none !important;
		}
	}
</style>
