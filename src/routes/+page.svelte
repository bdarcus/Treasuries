<script lang="ts">
</script>

<div class="text-center py-12">
	<h1 class="font-serif text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
		TIPS Ladder Architect
	</h1>
	<p class="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
		Plan your guaranteed, inflation-protected income stream with the unique duration-matching engine for gap-year coverage.
	</p>
	<div class="mt-10 flex items-center justify-center gap-x-6">
		<a
			href="/design"
			class="rounded-xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all hover:-translate-y-1"
		>
			Design New Ladder
		</a>
		<a href="/import" class="text-sm font-bold leading-6 text-slate-900 hover:text-emerald-600 transition-colors">
			Import Existing Portfolio <span aria-hidden="true">→</span>
		</a>
	</div>
</div>

<div class="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:px-8 max-w-5xl mx-auto">
	<div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-all cursor-pointer group" onclick={() => window.location.href='/design'}>
		<div class="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">🌱</div>
		<h2 class="font-serif text-2xl font-bold mb-2">Start Fresh</h2>
		<p class="text-slate-600 mb-4">Build a new ladder from cash using an optimized selection strategy.</p>
		<div class="text-emerald-600 font-bold text-xs tracking-widest uppercase">Build from Zero →</div>
	</div>

	<div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-all cursor-pointer group" onclick={() => window.location.href='/import'}>
		<div class="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">📈</div>
		<h2 class="font-serif text-2xl font-bold mb-2">Maintain & Extend</h2>
		<p class="text-slate-600 mb-4">Rebalance your existing portfolio and add new rungs with duration matching.</p>
		<div class="text-emerald-600 font-bold text-xs tracking-widest uppercase">Sync Holdings →</div>
	</div>
</div>
