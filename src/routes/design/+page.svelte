<script lang="ts">
	import { registry } from '$lib';
	import { goto } from '$app/navigation';
</script>

{#if registry.activeId}
	{@const activeModule = registry.getModule(registry.activeId)}
	{#if activeModule}
		{@const Config = activeModule.ui.Config}
		<Config />
	{/if}
{:else}
	<div class="max-w-xl mx-auto py-20 text-center space-y-6">
		<div class="text-6xl">🧩</div>
		<h2 class="text-3xl font-serif font-bold text-slate-900">Select a Strategy</h2>
		<p class="text-slate-500 text-lg leading-relaxed">
			You haven't selected a module to configure yet. Head back to the dashboard to select a financial strategy to design.
		</p>
		<div class="pt-4">
			<button 
				onclick={() => goto('/')} 
				class="inline-block px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
			>
				Go to Dashboard
			</button>
		</div>
	</div>
{/if}
