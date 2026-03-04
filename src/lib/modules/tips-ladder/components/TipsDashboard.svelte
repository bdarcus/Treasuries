<script lang="ts">
	import { ladderStore } from '../store/ladder';
	import { formatCurrency } from '../../../shared/financial';

	let state = $derived($ladderStore);
	let totalIncome = $derived(state.ladders.reduce((sum, l) => sum + l.annualIncome, 0));
	let ladderCount = $derived(state.ladders.length);
</script>

{#if ladderCount === 0}
	<div class="text-slate-400 italic text-sm">No ladders designed.</div>
{:else}
	<div class="space-y-4">
		<div class="flex justify-between items-end">
			<div>
				<div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Ladder Income</div>
				<div class="text-2xl font-serif font-bold text-slate-900">{formatCurrency(totalIncome)} <span class="text-xs font-sans text-slate-400 font-normal">/yr</span></div>
			</div>
			<div class="text-right">
				<div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Ladders</div>
				<div class="text-sm font-bold text-slate-700">{ladderCount} {ladderCount === 1 ? 'Source' : 'Sources'}</div>
			</div>
		</div>

		<div class="pt-3 border-t border-slate-50 space-y-2">
			{#each state.ladders.slice(0, 3) as ladder}
				<div class="flex justify-between items-center text-[10px]">
					<div class="flex items-center space-x-2">
						<div class="w-1.5 h-1.5 rounded-full {ladder.type === 'tips-manual' ? 'bg-emerald-500' : 'bg-blue-400'}"></div>
						<span class="font-bold text-slate-600 uppercase tracking-wider truncate max-w-[100px]">{ladder.name}</span>
					</div>
					<div class="flex items-center space-x-3">
						<span class="text-slate-400 font-bold">{ladder.startYear}–{ladder.endYear}</span>
						<span class="font-black text-slate-900">{formatCurrency(ladder.annualIncome)}</span>
					</div>
				</div>
			{/each}
			{#if ladderCount > 3}
				<div class="text-[9px] text-center font-black text-slate-300 uppercase tracking-widest pt-1">
					+ {ladderCount - 3} more sources
				</div>
			{/if}
		</div>
	</div>
{/if}
