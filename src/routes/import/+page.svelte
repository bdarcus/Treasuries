<script lang="ts">
	import { onMount } from 'svelte';
	import { runRebalance, toDateStr } from '$lib/engine/rebalance-engine.js';
	import { fetchMarketData, getRefCpi, type MarketData } from '$lib/engine/market-data';
	import { parseHoldingsCsv, type Holding } from '$lib/engine/csv-parser';
	import { ladderStore } from '$lib/stores/ladder';
	import { exportToCsv } from '$lib/engine/export';

	let marketData = $state<MarketData | null>(null);
	let holdings = $state<Holding[]>([]);
	let income = $state<number | null>(null);
	let results = $state<any>(null);
	let error = $state<string | null>(null);
	let fileName = $state("");

	onMount(async () => {
		ladderStore.load();
		try {
			marketData = await fetchMarketData();
			
			// Hydrate from store if data exists
			const saved = $ladderStore;
			if (saved.holdings.length > 0) {
				holdings = saved.holdings;
				if (saved.target) income = saved.target.income;
				if (saved.lastResults) results = saved.lastResults;
			}
		} catch (e) {
			error = "Failed to load market data.";
		}
	});

	async function handleUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		fileName = file.name;
		const text = await file.text();
		holdings = parseHoldingsCsv(text);
		if (holdings.length === 0) {
			error = "No valid holdings found in CSV (expected: CUSIP, Quantity).";
		} else {
			error = null;
		}
	}

	function rebalance() {
		if (!marketData || holdings.length === 0) return;
		try {
			error = null;
			const dateStr = toDateStr(marketData.settlementDate);
			const refCPI = getRefCpi(marketData.refCpiRows, dateStr);
			results = runRebalance({
				dara: income,
				method: 'Gap', // Use the core maintenance innovation
				holdings,
				tipsMap: marketData.tipsMap,
				refCPI: refCPI,
				settlementDate: marketData.settlementDate
			});

			// Save to store
			ladderStore.save({
				holdings: results.results.map((r: any) => ({ 
					cusip: r[0], 
					qty: typeof r[8] === 'number' ? r[8] : r[1] // Use target qty if set, else current
				})),
				target: { 
					startYear: results.summary.firstYear, 
					endYear: results.summary.lastYear, 
					income: results.summary.DARA 
				},
				lastResults: results
			});
		} catch (e: any) {
			error = e.message;
		}
	}
</script>

<div class="space-y-8">
	{#if holdings.length === 0}
		<div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
			<h2 class="font-serif text-3xl font-bold mb-4">Portfolio Rebalancer</h2>
			<p class="text-slate-500 mb-8">Upload your current TIPS holdings to identify gaps and optimize your income stream using duration-matched rebalancing.</p>
			
			<div class="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 inline-block text-left mx-auto">
				<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 text-center">Required CSV Format</div>
				<code class="text-xs font-mono text-slate-600 block bg-white p-3 rounded-lg border border-slate-200">
					cusip,qty<br/>
					91282CDX6,15000<br/>
					91282CGK1,10000
				</code>
				<p class="text-[10px] text-slate-400 mt-2 text-center">Supports headers like 'CUSIP', 'Qty', 'Quantity', or 'Face Value'.</p>
			</div>

			<label class="block">
				<span class="sr-only">Choose CSV</span>
				<input type="file" accept=".csv" onchange={handleUpload}
					class="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
			</label>
		</div>
	{:else}
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
			<div class="flex items-center">
				<div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mr-4">
					{fileName ? '📄' : '📁'}
				</div>
				<div>
					<h2 class="font-serif text-xl font-bold text-slate-900">
						{fileName ? fileName : 'Stored Portfolio'}
					</h2>
					<p class="text-xs font-bold text-emerald-600 uppercase tracking-widest">
						{holdings.length} Securities Identified
					</p>
				</div>
			</div>
			<button 
				onclick={() => {
					holdings = [];
					results = null;
					fileName = "";
				}}
				class="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition-colors"
			>
				Change Portfolio
			</button>
		</div>
	{/if}

	{#if holdings.length > 0}
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
			<!-- Rebalance Sidebar -->
			<aside class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
				<h3 class="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">Rebalance Goals</h3>
				
				<div class="space-y-2">
					<label for="income" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Target Annual Income ($)</label>
					<input type="number" id="income" bind:value={income} placeholder="Leave blank to infer from holdings"
						class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" />
					<p class="text-[10px] text-slate-400 mt-2 leading-relaxed italic">
						Inferred DARA will calculate the sustainable income from your current holdings.
					</p>
				</div>

				<button onclick={rebalance}
					class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5">
					Run Maintenance Rebalance
				</button>

				{#if error}
					<div class="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
						⚠️ {error}
					</div>
				{/if}
			</aside>

			<!-- Results Section -->
			<section class="lg:col-span-8 space-y-8">
				{#if !results}
					<div class="bg-white rounded-3xl border border-slate-200 p-12 text-center">
						<div class="text-4xl mb-4">⚖️</div>
						<h3 class="font-serif text-xl font-bold">Ready to Optimize</h3>
						<p class="text-slate-500 text-sm max-w-xs mx-auto mt-2">Adjust your target income on the left to see the required trades to cover any gaps.</p>
					</div>
				{:else}
					<!-- Rebalance Stats -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
							<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Inferred DARA</div>
							<div class="font-serif text-2xl font-bold">${Math.round(results.summary.inferredDARA).toLocaleString()}</div>
						</div>
						<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
							<div class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Target DARA</div>
							<div class="font-serif text-2xl font-bold">${Math.round(results.summary.DARA).toLocaleString()}</div>
						</div>
						<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
							<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Net Cash Delta</div>
							<div class="font-serif text-2xl font-bold {results.summary.costDeltaSum >= 0 ? 'text-emerald-600' : 'text-red-600'}">
								{results.summary.costDeltaSum >= 0 ? '+' : ''}${Math.round(results.summary.costDeltaSum).toLocaleString()}
							</div>
						</div>
					</div>

					<!-- Innovation Callout -->
					{#if results.summary.gapYears.length > 0}
						<div class="bg-white border-l-4 border-emerald-500 rounded-2xl p-6 shadow-sm">
							<div class="flex items-start">
								<div class="text-2xl mr-4">🔄</div>
								<div>
									<h4 class="font-bold text-slate-900 mb-1">Gap Maintenance Strategy</h4>
									<p class="text-sm text-slate-600 leading-relaxed mb-4">
										The engine identified gaps in <strong>{results.summary.gapYears.join(', ')}</strong>. 
										It proposes selling excess holdings in the <strong>{results.summary.brackets.lowerYear}</strong> and <strong>{results.summary.brackets.upperYear}</strong> brackets to mathematically cover the income requirements for those gap years.
									</p>
									<div class="grid grid-cols-2 gap-4">
										<div class="p-4 bg-slate-50 rounded-xl">
											<div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sell Excess {results.summary.brackets.lowerYear}</div>
											<div class="text-lg font-bold text-emerald-600">{Math.round(results.summary.lowerWeight * 100)}% Coverage Weight</div>
										</div>
										<div class="p-4 bg-slate-50 rounded-xl">
											<div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sell Excess {results.summary.brackets.upperYear}</div>
											<div class="text-lg font-bold text-emerald-600">{Math.round(results.summary.upperWeight * 100)}% Coverage Weight</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Trade List -->
					<div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
						<div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
							<h3 class="font-serif text-xl font-bold">Maintenance Trades</h3>
							<div class="flex items-center gap-4">
								<div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Method: Gap Rebalance</div>
								<button 
									onclick={() => exportToCsv('tips-rebalance-plan.csv', results.HDR, results.results)}
									class="px-3 py-1 bg-white border border-slate-200 text-emerald-600 text-[10px] font-black rounded hover:bg-slate-50 uppercase tracking-widest transition-colors shadow-sm"
								>
									Export CSV
								</button>
							</div>
						</div>
						<div class="overflow-x-auto">
							<table class="w-full text-left">
								<thead class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
									<tr>
										<th class="px-6 py-4">Security</th>
										<th class="px-6 py-4">Action</th>
										<th class="px-6 py-4 text-right">Cash Effect</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each results.results as row}
										{#if row[9] !== 0 && row[9] !== ""}
											<tr class="hover:bg-slate-50 transition-colors">
												<td class="px-6 py-4">
													<div class="font-bold text-slate-900">{row[0]}</div>
													<div class="text-[10px] text-slate-500">Matures {row[2]}</div>
												</td>
												<td class="px-6 py-4">
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold {row[9] > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
														{row[9] > 0 ? 'BUY' : 'SELL'} {Math.abs(row[9]).toLocaleString()}
													</span>
												</td>
												<td class="px-6 py-4 text-right font-serif font-bold text-lg {row[11] >= 0 ? 'text-emerald-600' : 'text-red-600'}">
													{row[11] >= 0 ? '+' : '-'}${Math.round(Math.abs(row[11])).toLocaleString()}
												</td>
											</tr>
										{/if}
									{/each}
								</tbody>
								<tfoot class="bg-slate-900 text-white font-bold">
									<tr>
										<td colspan="2" class="px-6 py-6 text-right uppercase tracking-widest text-xs opacity-60">Net Rebalance Cost</td>
										<td class="px-6 py-6 text-right font-serif text-2xl text-emerald-400">${Math.round(Math.abs(results.summary.costDeltaSum)).toLocaleString()}</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>
				{/if}
			</section>
		</div>
	{/if}
</div>
