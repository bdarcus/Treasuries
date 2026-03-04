<script lang="ts">
import { onMount } from "svelte";
import { runRebalance } from "../engine/rebalance-engine";
import { toDateStr, localDate } from "../../../shared/date";
import {
	fetchMarketData,
	getRefCpi,
	type MarketData,
} from "../engine/market-data";
import { ladderStore, type BondLadder } from "../store/ladder";
import { exportToCsv } from "../engine/export";
import { goto } from "$app/navigation";

let marketData = $state<MarketData | null>(null);
let error = $state<string | null>(null);

// Multi-ladder UI state
let activeLadderId = $state<string | null>(null);
let isAddingNew = $state(false);

// Current Editing Form
let currentName = $state("");
let currentType = $state<"tips-manual" | "simple-income">("tips-manual");
let currentTaxStatus = $state<"taxable" | "tax-free" | "deferred">("taxable");
let startYear = $state(new Date().getFullYear());
let endYear = $state(new Date().getFullYear() + 9);
let income = $state(10000);

// Advanced Settings (for TIPS generator)
let strategy = $state<"Default" | "Cheapest">("Default");
let excludeCusipsStr = $state("");
let customSettlementDate = $state("");
let marginalTaxRate = $state(0);

let results = $state<any>(null);
let liveEstimate = $state<number | null>(null);

onMount(async () => {
	ladderStore.load();
	// Auto-select first ladder if none selected
	if ($ladderStore.ladders.length > 0 && !activeLadderId && !isAddingNew) {
		editLadder($ladderStore.ladders[0]);
	}

	try {
		marketData = await fetchMarketData();
		if (marketData) {
			customSettlementDate = toDateStr(marketData.settlementDate);
		}
	} catch (e) {
		error = "Failed to load market data.";
	}
});

// Handle external store changes (like after migration)
$effect(() => {
	if ($ladderStore.ladders.length > 0 && !activeLadderId && !isAddingNew) {
		editLadder($ladderStore.ladders[0]);
	}
});

function resetForm() {
	currentName = "";
	currentType = "tips-manual";
	currentTaxStatus = "taxable";
	startYear = new Date().getFullYear();
	endYear = new Date().getFullYear() + 9;
	income = 10000;
	results = null;
	liveEstimate = null;
}

function startAdding() {
	resetForm();
	isAddingNew = true;
	activeLadderId = null;
}

function editLadder(ladder: BondLadder) {
	isAddingNew = false;
	activeLadderId = ladder.id;
	currentName = ladder.name;
	currentType = ladder.type;
	currentTaxStatus = ladder.taxStatus || "taxable";
	startYear = ladder.startYear;
	endYear = ladder.endYear;
	income = ladder.annualIncome;
	results = null;
}

function getSettlementDate() {
	return customSettlementDate
		? localDate(customSettlementDate)
		: marketData!.settlementDate;
}

function getExcludeCusips() {
	return excludeCusipsStr
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

function updateEstimate() {
	if (
		currentType !== "tips-manual" ||
		!marketData ||
		income <= 0 ||
		startYear <= 0 ||
		endYear < startYear
	) {
		liveEstimate = null;
		return;
	}
	try {
		const sDate = getSettlementDate();
		const dateStr = toDateStr(sDate);
		const refCPI = getRefCpi(marketData.refCpiRows, dateStr);
		const res = runRebalance({
			dara: income,
			method: "Full",
			holdings: [],
			tipsMap: marketData.tipsMap,
			refCPI: refCPI,
			settlementDate: sDate,
			startYear,
			endYear,
			excludeCusips: getExcludeCusips(),
			strategy,
			marginalTaxRate: marginalTaxRate / 100,
		});
		liveEstimate = Math.abs(res.summary.costDeltaSum);
	} catch (e) {
		liveEstimate = null;
	}
}

function saveSimple() {
	const ladderData = {
		name: currentName || "New Income Stream",
		type: "simple-income" as const,
		taxStatus: currentTaxStatus,
		startYear,
		endYear,
		annualIncome: income,
	};

	if (activeLadderId) {
		ladderStore.updateLadder(activeLadderId, ladderData);
	} else {
		ladderStore.addLadder(ladderData);
	}

	ladderStore.save($ladderStore);
	isAddingNew = false;
}

function generateTips() {
	if (!marketData) return;
	try {
		error = null;
		const sDate = getSettlementDate();
		const dateStr = toDateStr(sDate);
		const refCPI = getRefCpi(marketData.refCpiRows, dateStr);
		results = runRebalance({
			dara: income,
			method: "Full",
			holdings: [],
			tipsMap: marketData.tipsMap,
			refCPI: refCPI,
			settlementDate: sDate,
			startYear,
			endYear,
			excludeCusips: getExcludeCusips(),
			strategy,
			marginalTaxRate: marginalTaxRate / 100,
		});
	} catch (e: any) {
		error = e.message;
	}
}

function commitTips() {
	if (!results) return;

	const ladderData = {
		name: currentName || "TIPS Ladder",
		type: "tips-manual" as const,
		taxStatus: currentTaxStatus,
		holdings: results.results
			.map((r: any) => ({ cusip: r[0], qty: r[8] }))
			.filter((h: any) => h.qty > 0),
		startYear,
		endYear,
		annualIncome: income,
	};

	if (activeLadderId) {
		ladderStore.updateLadder(activeLadderId, ladderData);
	} else {
		ladderStore.addLadder(ladderData);
	}

	ladderStore.save($ladderStore);
	isAddingNew = false;
	goto("/track");
}

$effect(() => {
	if (
		currentType === "tips-manual" &&
		(startYear ||
			endYear ||
			income ||
			strategy ||
			excludeCusipsStr ||
			customSettlementDate ||
			marginalTaxRate !== undefined)
	) {
		updateEstimate();
	}
});
</script>

<div class="space-y-8">
	<!-- Top Bar: Ladder Management -->
	<header class="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
		<div class="flex items-center space-x-4">
			<h2 class="font-serif text-xl font-bold text-slate-900">Your Income Ladders</h2>
			<div class="h-4 w-px bg-slate-200"></div>
			<div class="flex gap-2">
				{#each $ladderStore.ladders as ladder}
					<button 
						onclick={() => editLadder(ladder)}
						class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all {activeLadderId === ladder.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}"
					>
						{ladder.name}
					</button>
				{/each}
				<button 
					onclick={startAdding}
					class="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
				>
					+ Add Ladder
				</button>
			</div>
		</div>
	</header>

	{#if isAddingNew || activeLadderId}
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
			<!-- Sidebar Inputs -->
			<aside class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
				<div class="flex justify-between items-center border-b border-slate-100 pb-4">
					<h2 class="font-serif text-2xl font-bold text-slate-900">{activeLadderId ? 'Edit' : 'New'} Ladder</h2>
					<button onclick={() => { isAddingNew = false; activeLadderId = null; }} class="text-slate-400 hover:text-slate-600">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
					</button>
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<label for="ladder-name" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Ladder Name</label>
						<input type="text" id="ladder-name" bind:value={currentName} placeholder="e.g. Retirement Floor" class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" />
					</div>

					<div class="space-y-2">
						<label for="ladder-type" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Methodology</label>
						<select id="ladder-type" bind:value={currentType} class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm">
							<option value="tips-manual">TIPS Bond Calculator (Holdings-based)</option>
							<option value="simple-income">Simple Income Projection (Target only)</option>
						</select>
					</div>

					<div class="space-y-2">
						<label for="tax-status" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Tax Treatment</label>
						<select id="tax-status" bind:value={currentTaxStatus} class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm">
							<option value="taxable">Taxable Brokerage (Normal)</option>
							<option value="tax-free">Tax-Free (Roth IRA/401k)</option>
							<option value="deferred">Tax-Deferred (Traditional IRA/401k)</option>
						</select>
					</div>

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
						<label for="income" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Target Real Income ($/yr)</label>
						<input type="number" id="income" bind:value={income} class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-lg font-bold" />
					</div>
				</div>

				{#if currentType === 'simple-income'}
					<button 
						onclick={saveSimple}
						class="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all hover:bg-slate-800"
					>
						Save Income Stream
					</button>
				{:else}
					<div class="pt-4 border-t border-slate-100 space-y-4">
						<h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">TIPS Advanced Settings</h3>

						<div class="space-y-2">
							<label for="strategy" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Bond Selection</label>
							<select id="strategy" bind:value={strategy} class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm">
								<option value="Default">Default (Smooth Cashflow)</option>
								<option value="Cheapest">Cheapest (Maximize Yield)</option>
							</select>
						</div>

						<div class="space-y-2">
							<label for="tax" class="block text-[10px] font-black uppercase tracking-wider text-slate-500">Marginal Tax Rate (%)</label>
							<input type="number" id="tax" bind:value={marginalTaxRate} min="0" max="100" class="w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm" />
						</div>
					</div>

					{#if liveEstimate !== null}
						<div class="bg-slate-900 text-white rounded-xl p-6 text-center shadow-lg">
							<div class="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Estimated Investment</div>
							<div class="font-serif text-4xl font-bold">${Math.round(liveEstimate).toLocaleString()}</div>
						</div>
					{/if}

					<button 
						onclick={generateTips}
						class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all"
					>
						Generate Trade Ticket
					</button>
				{/if}

				{#if error}
					<div class="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
						⚠️ {error}
					</div>
				{/if}

				{#if activeLadderId}
					<button 
						onclick={() => { ladderStore.removeLadder(activeLadderId!); activeLadderId = null; ladderStore.save($ladderStore); }}
						class="w-full py-2 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors"
					>
						Delete Ladder
					</button>
				{/if}
			</aside>

			<!-- Results Area -->
			<section class="lg:col-span-8 space-y-8">
				{#if currentType === 'simple-income'}
					<div class="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
						<div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">📈</div>
						<h3 class="font-serif text-2xl font-bold text-slate-900 mb-2">Income Projection Ready</h3>
						<p class="text-slate-500 max-w-sm mx-auto mb-8">This ladder will contribute a flat real income of <strong>${income.toLocaleString()}</strong> from <strong>{startYear}</strong> to <strong>{endYear}</strong> in the general planning dashboard.</p>
						<button onclick={saveSimple} class="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Save to Plan</button>
					</div>
				{:else if !results}
					<div class="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
						<div class="text-4xl mb-4">📜</div>
						<h3 class="font-serif text-2xl font-bold text-slate-900 mb-2">Configure your TIPS holdings.</h3>
						<p class="text-slate-500 max-w-sm mx-auto">Generate a concrete shopping list of bonds based on current market pricing.</p>
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

					<!-- Trade Ticket -->
					<div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
						<div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
							<h3 class="font-serif text-xl font-bold">Shopping List (Trade Ticket)</h3>
							<div class="flex gap-2">
								<button 
									onclick={commitTips}
									class="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 uppercase tracking-widest transition-colors shadow-sm"
								>
									Save & Track Holdings
								</button>
							</div>
						</div>
						<div class="overflow-x-auto">
							<table class="w-full text-left">
								<thead class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
									<tr>
										<th class="px-6 py-4 border-b">Maturity</th>
										<th class="px-6 py-4 border-b">CUSIP</th>
										<th class="px-6 py-4 border-b">Quantity</th>
										<th class="px-6 py-4 text-right border-b">Est. Cost</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each results.results as row}
										{#if row[8] > 0}
											<tr class="hover:bg-slate-50 transition-colors">
												<td class="px-6 py-4">
													<div class="font-bold text-slate-900">{row[2]}</div>
													<div class="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Income for {row[3]}</div>
												</td>
												<td class="px-6 py-4 font-mono text-sm">{row[0]}</td>
												<td class="px-6 py-4 font-bold text-slate-700">{row[8].toLocaleString()}</td>
												<td class="px-6 py-4 text-right font-serif font-bold text-lg">${Math.round(row[10]).toLocaleString()}</td>
											</tr>
										{/if}
									{/each}
								</tbody>
								<tfoot class="bg-slate-900 text-white font-bold">
									<tr>
										<td colspan="3" class="px-6 py-6 text-right uppercase tracking-widest text-xs opacity-60">Total Estimated Cost</td>
										<td class="px-6 py-6 text-right font-serif text-2xl text-emerald-400">${Math.round(Math.abs(results.summary.costDeltaSum)).toLocaleString()}</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>
				{/if}
			</section>
		</div>
	{:else}
		<div class="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
			<div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">🏗️</div>
			<h3 class="font-serif text-2xl font-bold text-slate-900 mb-2">No Active Ladders</h3>
			<p class="text-slate-500 mb-8 text-sm">Build multiple bond ladders to cover different income phases or inflation-protection needs.</p>
			<button onclick={startAdding} class="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 shadow-lg transition-all">Create Your First Ladder</button>
		</div>
	{/if}
</div>

<style>
	@media print {
		:global(nav), aside, header, .print\:hidden {
			display: none !important;
		}
	}
</style>
