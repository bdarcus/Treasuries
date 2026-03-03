<script lang="ts">
	import { onMount } from 'svelte';
	import { ladderStore } from '$lib/stores/ladder';
	import './layout.css';
	// import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	onMount(() => {
		ladderStore.load();
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
	<title>TIPS Ladder Architect</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
	<nav class="bg-white border-b border-slate-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<a href="/" class="font-serif text-xl font-bold text-emerald-600">TIPS Ladder Architect</a>
					</div>
					<div class="hidden sm:-my-px sm:ml-8 sm:flex sm:space-x-8">
						<a href="/design" class="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300">Design</a>
						<a href="/import" class="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300">Import</a>
						<a href="/track" class="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300">Track</a>
						<a href="/resources" class="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300">Resources</a>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<main class="py-10">
		<div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
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
