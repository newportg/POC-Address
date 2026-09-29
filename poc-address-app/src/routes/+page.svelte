<script lang="ts">
	import type { Country, AddressResult } from '$lib/types';
	import Map from '$lib/Map.svelte';

	let countries = $state<Country[]>([]);
	let selectedCountry = $state<Country | null>(null);
	let searchQuery = $state('');
	let results = $state<AddressResult[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let selectedAddress = $state<any>(null);
	let retrieving = $state(false);
	let selectedResultId = $state<string | null>(null);

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
		selectedAddress = null;
		selectedResultId = null;

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

	async function selectProperty(result: AddressResult) {
		selectedResultId = result.id;
		retrieving = true;
		selectedAddress = null;

		try {
			const url = `/api/retrieve?id=${encodeURIComponent(result.id)}`;
			const res = await fetch(url);
			const data = await res.json();
			// Create a plain object to avoid Proxy reactivity issues
			selectedAddress = {
				id: data.id,
				label: data.label,
				address: data.address,
				components: { ...data.components },
				type: data.type,
				dataLevel: data.dataLevel,
			};
		} catch (err) {
			console.error('[Page] retrieve error:', err);
			error = 'Failed to retrieve address details';
		} finally {
			retrieving = false;
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

		<Map {results} selectedId={selectedResultId} onSelect={selectProperty} />

		{#if retrieving}
			<p class="loading">Retrieving address...</p>
		{/if}

		{#if selectedAddress}
			<div class="selected-address">
				<h2>Selected Address</h2>
				<p class="address">{selectedAddress.label || selectedAddress.address}</p>
				{#if selectedAddress.components}
					<dl class="components">
						{#if selectedAddress.components.organisation}
							<dt>Organisation</dt>
							<dd>{selectedAddress.components.organisation}</dd>
						{/if}
						{#if selectedAddress.components.buildingName}
							<dt>Building</dt>
							<dd>{selectedAddress.components.buildingName}</dd>
						{/if}
						{#if selectedAddress.components.buildingNumber}
							<dt>Number</dt>
							<dd>{selectedAddress.components.buildingNumber}</dd>
						{/if}
						{#if selectedAddress.components.street}
							<dt>Street</dt>
							<dd>{selectedAddress.components.street}</dd>
						{/if}
						{#if selectedAddress.components.district}
							<dt>District</dt>
							<dd>{selectedAddress.components.district}</dd>
						{/if}
						{#if selectedAddress.components.city}
							<dt>City</dt>
							<dd>{selectedAddress.components.city}</dd>
						{/if}
						{#if selectedAddress.components.province}
							<dt>Province</dt>
							<dd>{selectedAddress.components.province}</dd>
						{/if}
						{#if selectedAddress.components.postalCode}
							<dt>Postcode</dt>
							<dd>{selectedAddress.components.postalCode}</dd>
						{/if}
						{#if selectedAddress.components.country}
							<dt>Country</dt>
							<dd>{selectedAddress.components.country}</dd>
						{/if}
					</dl>
				{/if}
			</div>
		{/if}

		{#if results.length > 0}
			<ul class="results">
				{#each results as result}
					<li
						class:selected={selectedResultId === result.id}
						onclick={() => selectProperty(result)}
						onkeydown={(e) => e.key === 'Enter' && selectProperty(result)}
						role="button"
						tabindex="0"
					>
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
		padding-top: 10vh;
	}

	.container {
		width: 100%;
		max-width: 700px;
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

	.loading {
		text-align: center;
		color: #666;
		margin-top: 1rem;
	}

	.no-results {
		text-align: center;
		color: #666;
		margin-top: 2rem;
	}

	.selected-address {
		background: white;
		padding: 20px;
		margin-top: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.selected-address h2 {
		margin: 0 0 10px 0;
		font-size: 18px;
		color: #333;
	}

	.address {
		font-size: 16px;
		font-weight: 500;
		color: #0066cc;
		margin-bottom: 15px;
		white-space: pre-line;
	}

	.components {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 8px;
		margin: 0;
	}

	.components dt {
		font-weight: 600;
		color: #666;
	}

	.components dd {
		margin: 0;
		color: #333;
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
		cursor: pointer;
		border: 2px solid transparent;
		transition: border-color 0.2s, background 0.2s;
	}

	.results li:hover {
		background: #f0f7ff;
	}

	.results li.selected {
		border-color: #0066cc;
		background: #e6f2ff;
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
