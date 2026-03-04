<script lang="ts">
	import { registry } from '$lib';

	const activeModuleId = registry.getActiveId();
	const allModules = registry.getAllModules();
</script>

{#if $activeModuleId}
	{@const activeModule = $allModules.find(m => m.id === $activeModuleId)}
	{#if activeModule}
		{@const Config = activeModule.ui.Config}
		<Config />
	{/if}
{:else}
	<div class="p-12 text-center text-slate-400">
		Please select a module to begin designing.
	</div>
{/if}
