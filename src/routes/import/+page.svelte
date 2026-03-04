<script lang="ts">
	import { registry } from '$lib';

	const activeModuleId = registry.getActiveId();
	const allModules = registry.getAllModules();
</script>

{#if $activeModuleId}
	{@const activeModule = $allModules.find(m => m.id === $activeModuleId)}
	{#if activeModule && activeModule.ui.Import}
		{@const Import = activeModule.ui.Import}
		<Import />
	{:else}
		<div class="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
			<div class="text-4xl mb-4">📁</div>
			<h3 class="text-xl font-bold text-slate-900">Import Not Supported</h3>
			<p class="mt-2">The selected module "{activeModule?.name}" does not support data import.</p>
		</div>
	{/if}
{:else}
	<div class="p-12 text-center text-slate-400">
		Please select a module to begin.
	</div>
{/if}
