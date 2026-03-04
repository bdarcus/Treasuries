<script lang="ts">
	import { ssStore } from '../store/ss';
	import { formatCurrency } from '../../../shared/financial';
	import { SocialSecurityModule } from '../index';

	let state = $derived($ssStore);
	let result = $derived(SocialSecurityModule.engine.calculate({}));
</script>

<div class="space-y-3">
	<div class="flex justify-between items-end">
		<div>
			<div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Claiming Year</div>
			<div class="text-2xl font-serif font-bold text-slate-900">{result.startYear}</div>
		</div>
		<div class="text-right">
			<div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Est.</div>
			<div class="text-sm font-bold text-emerald-600">{formatCurrency(state.annualBenefit / 12)}</div>
		</div>
	</div>
</div>
