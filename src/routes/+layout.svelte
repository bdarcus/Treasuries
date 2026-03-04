<script lang="ts">
	import { onMount } from 'svelte';
	import { registry } from '$lib';
	import { planningStore } from '$lib/shared/planning';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import './layout.css';

	let { children } = $props();

	const activeModuleId = registry.getActiveId();
	const allModules = registry.getAllModules();
	const enabledModules = registry.getEnabledModules();

	onMount(() => {
		// Load registry state (enabled/disabled)
		registry.loadRegistry();

		// Load planning state first
		planningStore.load();

		// Load all module states
		$allModules.forEach(m => m.store.load());
		
		// Specifically for Portfolio module, fetch external assumptions
		const portfolioModule = registry.getModule('portfolio-manager');
		if (portfolioModule && 'fetchAssumptions' in portfolioModule.store) {
			(portfolioModule.store as any).fetchAssumptions();
		}
	});

	function setActive(id: string) {
		registry.setActive(id);
		// If we are on the home page, navigate to design view when selecting a module
		if (page.url.pathname === '/') {
			goto('/design');
		}
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
	<title>Financial Modulator</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
	<!-- Navbar with Module Picker -->
	<nav class="bg-white border-b border-slate-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<a href="/" class="font-serif text-xl font-bold text-emerald-600">Financial Modulator</a>
					</div>
					<div class="hidden sm:-my-px sm:ml-8 sm:flex sm:space-x-4">
						{#each $enabledModules as m}
							<button 
								onclick={() => setActive(m.id)}
								class="inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors {m.id === $activeModuleId ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
							>
								{m.name}
							</button>
						{/each}
					</div>
				</div>
				<div class="flex items-center space-x-6">
					<a href="/resources" class="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Resources</a>
					<div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Modular Platform</div>
				</div>
			</div>
		</div>
	</nav>

	<!-- Main Content Area -->
	<main class="flex-1 py-10">
		<div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
			<!-- Show the active module's name at the top -->
			{#if $activeModuleId}
				{@const activeModule = modules.find(m => m.id === $activeModuleId)}
				<div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div>
						<h1 class="text-3xl font-serif font-bold text-slate-900">{activeModule?.name}</h1>
						<p class="text-slate-500 mt-1">{activeModule?.description}</p>
					</div>

					<!-- View Switcher -->
					{#if page.url.pathname !== '/'}
						<div class="flex bg-slate-200/50 p-1 rounded-xl self-start md:self-end">
							<a 
								href="/design" 
								class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all {page.url.pathname === '/design' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
							>
								Design
							</a>
							<a 
								href="/track" 
								class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all {page.url.pathname === '/track' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
							>
								Track
							</a>
							{#if activeModule?.ui.Import}
								<a 
									href="/import" 
									class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all {page.url.pathname === '/import' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
								>
									Import
								</a>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			{@render children()}
		</div>
	</main>
</div>

<style>
	:global(.font-serif) {
		font-family: 'Fraunces', serif;
	}
	:global(.font-sans) {
		font-family: 'Plus Jakarta Sans', sans-serif;
	}
	:global(.font-mono) {
		font-family: 'JetBrains Mono', monospace;
	}
</style>
