<script lang="ts">
import { registry } from "$lib";
</script>

{#if registry.activeId}
	{@const activeModule = registry.getModule(registry.activeId)}
	{#if activeModule}
		{@const Analysis = activeModule.ui.Analysis}
		<Analysis />
	{/if}
{:else}
	<div class="p-12 text-center text-slate-400">
		Please select a module to view analysis.
	</div>
{/if}
