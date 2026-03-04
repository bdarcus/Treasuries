<script lang="ts">
import { onMount } from "svelte";
import { ladderStore } from "../store/ladder";
import { formatCurrency } from "../../../shared/financial";

let state = $derived($ladderStore);
let totalIncome = $derived(
	state.ladders.reduce((sum, l) => sum + l.annualIncome, 0),
);

let minYear = $derived(
	state.ladders.length
		? Math.min(...state.ladders.map((l) => l.startYear))
		: new Date().getFullYear(),
);
let maxYear = $derived(
	state.ladders.length
		? Math.max(...state.ladders.map((l) => l.endYear))
		: minYear + 30,
);

let years = $derived.by(() => {
	const result = [];
	for (let y = minYear; y <= maxYear; y++) {
		const incomeForYear = state.ladders
			.filter((l) => y >= l.startYear && y <= l.endYear)
			.reduce((sum, l) => sum + l.annualIncome, 0);

		result.push({
			year: y,
			income: incomeForYear,
		});
	}
	return result;
});

let maxAnnualIncome = $derived(
	years.length ? Math.max(...years.map((y) => y.income)) : 0,
);

onMount(() => {
	ladderStore.load();
});
</script>

{#if state.ladders.length === 0}
	<div class="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
		<div class="text-5xl mb-6">🔭</div>
		<h2 class="font-serif text-3xl font-bold text-slate-900 mb-4">No Ladders Found</h2>
		<p class="text-slate-500 max-w-sm mx-auto mb-8">You haven't designed or imported any bond ladders yet. Start by creating a new ladder in the configuration tab.</p>
	</div>
{:else}
	<div class="space-y-8">
		<header>
			<h1 class="font-serif text-4xl font-bold text-slate-900">Income Analysis</h1>
			<p class="text-slate-500 mt-2">Combined projection for all {state.ladders.length} active income sources.</p>
		</header>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
				<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Peak Income</div>
				<div class="font-serif text-3xl font-bold text-slate-900">{formatCurrency(maxAnnualIncome)} <span class="text-xs font-sans text-slate-400 font-normal">/yr</span></div>
			</div>
			<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
				<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Planning Horizon</div>
				<div class="font-serif text-3xl font-bold text-slate-900">{minYear} – {maxYear}</div>
			</div>
			<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
				<div class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Coverage Status</div>
				<div class="font-serif text-3xl font-bold text-emerald-600">Active</div>
			</div>
		</div>

		<!-- Visual Chart -->
		<div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
			<div class="flex justify-between items-center mb-8">
				<h3 class="font-serif text-xl font-bold">Aggregate Real Income Projection</h3>
			</div>

			<div class="relative h-64 flex items-end gap-1 border-b border-slate-100 pb-2">
				{#each years as y}
					{@const barHeight = maxAnnualIncome > 0 ? (y.income / maxAnnualIncome) * 100 : 0}
					<div class="flex-1 flex flex-col items-center group relative h-full justify-end">
						<div 
							class="bg-emerald-500 w-full rounded-t-sm transition-all group-hover:bg-emerald-400 min-h-[1px] relative z-10" 
							style="height: {barHeight}%"
						>
							<div class="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white p-2 rounded text-[10px] whitespace-nowrap z-50 shadow-xl">
								{y.year}: {formatCurrency(y.income)}
							</div>
						</div>
						<div class="absolute -bottom-8 text-[9px] font-black text-slate-400 whitespace-nowrap overflow-hidden max-w-full">
							{y.year % 5 === 0 ? y.year : ''}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- List View -->
		<div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
			<table class="w-full text-left">
				<thead class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
					<tr>
						<th class="px-6 py-4">Source Name</th>
						<th class="px-6 py-4">Type</th>
						<th class="px-6 py-4">Period</th>
						<th class="px-6 py-4 text-right">Annual Income</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each state.ladders as ladder}
						<tr class="hover:bg-slate-50 transition-colors">
							<td class="px-6 py-4">
								<div class="font-serif text-lg font-bold text-slate-900">{ladder.name}</div>
							</td>
							<td class="px-6 py-4">
								<div class="flex flex-col gap-1">
									<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-fit {ladder.type === 'tips-manual' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-700'}">
										{ladder.type === 'tips-manual' ? 'TIPS Bonds' : 'Simple Income'}
									</span>
									<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-fit {ladder.taxStatus === 'tax-free' ? 'bg-blue-50 text-blue-700' : ladder.taxStatus === 'deferred' ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-700'}">
										{ladder.taxStatus === 'tax-free' ? 'Roth (Tax-Free)' : ladder.taxStatus === 'deferred' ? 'Traditional (Deferred)' : 'Taxable'}
									</span>
								</div>
							</td>
							<td class="px-6 py-4 font-bold text-slate-500">
								{ladder.startYear} – {ladder.endYear}
							</td>
							<td class="px-6 py-4 text-right font-serif font-bold text-lg text-slate-900">
								{formatCurrency(ladder.annualIncome)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
