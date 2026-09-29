<script lang="ts">
	import type { Country, AddressResult } from '$lib/types';

	let countries = $state<Country[]>([]);
	let selectedCountry = $state<Country | null>(null);
	let searchQuery = $state('');
	let results = $state<AddressResult[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		fetchCountries();
	});

	async function fetchCountries() {
		try {
			const res = await fetch('/api/countries');
			countries = await res.json();
			selectedCountry = countries.find((c) => c.code === 'GB') || countries[0] || null;
		} catch (err) {
			error = 'Failed to load countries';
		}
	}

	async function search() {
		if (!searchQuery.trim() || !selectedCountry) return;

		loading = true;
		error = null;
		results = [];

		try {
			const res = await fetch(
				`/api/search?country=${encodeURIComponent(selectedCountry.name)}&query=${encodeURIComponent(searchQuery)}`
			);
			const data = await res.json();
			results = data.results || [];
		} catch (err) {
			error = 'Search failed. Please try again.';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			search();
		}
	}
</script>

<main>
	<div class="container">
		<h1>Address Search</h1>

		<div class="search-box">
			<select bind:value={selectedCountry} aria-label="Select country">
				{#each countries as country}
					<option value={country}>
						{country.flag} {country.name}
					</option>
				{/each}
			</select>

			<input
				type="text"
				placeholder="Enter an address..."
				bind:value={searchQuery}
				onkeydown={handleKeydown}
			/>

			<button onclick={search} disabled={loading}>
				{loading ? 'Searching...' : 'Search'}
			</button>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if results.length > 0}
			<ul class="results">
				{#each results as result}
					<li>
						<span class="result-text">{result.text}</span>
						{#if result.description}
							<span class="result-description">{result.description}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{:else if !loading && searchQuery && !error}
			<p class="no-results">No addresses found.</p>
		{/if}
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, -apple-system, sans-serif;
		background: #f5f5f5;
	}

	main {
		min-height: 100vh;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 15vh;
	}

	.container {
		width: 100%;
		max-width: 600px;
		padding: 0 20px;
	}

	h1 {
		text-align: center;
		color: #333;
		margin-bottom: 2rem;
	}

	.search-box {
		display: flex;
		gap: 10px;
		background: white;
		padding: 15px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	select {
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 14px;
		min-width: 160px;
	}

	input {
		flex: 1;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 14px;
	}

	button {
		padding: 10px 20px;
		background: #0066cc;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
	}

	button:hover:not(:disabled) {
		background: #0052a3;
	}

	button:disabled {
		background: #999;
		cursor: not-allowed;
	}

	.error {
		color: #d32f2f;
		text-align: center;
		margin-top: 1rem;
	}

	.no-results {
		text-align: center;
		color: #666;
		margin-top: 2rem;
	}

	.results {
		list-style: none;
		padding: 0;
		margin-top: 20px;
	}

	.results li {
		background: white;
		padding: 15px;
		margin-bottom: 8px;
		border-radius: 4px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.result-text {
		font-weight: 500;
		color: #333;
	}

	.result-description {
		font-size: 13px;
		color: #666;
	}
</style>
