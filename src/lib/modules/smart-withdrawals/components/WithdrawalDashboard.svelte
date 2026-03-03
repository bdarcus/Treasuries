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

		const smartMod = registry.getModule('smart-withdrawals');
		if (!smartMod) return null;
		return smartMod.engine.calculate({});
	});
</script>

<div class="space-y-3">
	<div class="flex justify-between items-end">
		<div>
			<div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Spending</div>
			<div class="text-2xl font-serif font-bold text-green-600">{formatCurrency((result?.totalSpending || 0) / 12)}</div>
		</div>
		<div class="text-right">
			<div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Planning Horizon</div>
			<div class="text-sm font-bold text-slate-700">{Math.round(horizon.yearsRemaining)} yrs</div>
		</div>
	</div>
	
	<div class="pt-2 border-t border-slate-100">
		<div class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Safety Margin</div>
		<div class="flex items-center space-x-2">
			<div class="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
				<div class="h-full bg-green-500" style="width: {state.conservatismMargin * 100}%"></div>
			</div>
			<span class="text-[10px] font-bold text-green-600">{Math.round(state.conservatismMargin * 100)}%</span>
		</div>
	</div>
</div>
