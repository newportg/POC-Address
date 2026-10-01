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
	let selectedCoordinates = $state<[number, number] | null>(null);

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
		selectedCoordinates = null;

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
		selectedCoordinates = null;
		retrieving = true;
		selectedAddress = null;

		try {
			const url = `/api/retrieve?id=${encodeURIComponent(result.id)}&text=${encodeURIComponent(result.text)}&description=${encodeURIComponent(result.description || '')}&country=${encodeURIComponent(selectedCountry?.name || 'United Kingdom')}`;
			const res = await fetch(url);
			const data = await res.json();
			// Create a plain object to avoid Proxy reactivity issues
			selectedAddress = {
				id: data.id,
				input: { ...data.input },
				match: { ...data.match },
				countryMask: data.countryMask,
			};
			const latitudeValue = data.match?.Latitude;
			const longitudeValue = data.match?.Longitude;
			const latitude = Number(latitudeValue);
			const longitude = Number(longitudeValue);
			selectedCoordinates = latitudeValue != null && String(latitudeValue).trim() !== ''
				&& longitudeValue != null && String(longitudeValue).trim() !== ''
				&& Number.isFinite(latitude) && Number.isFinite(longitude)
				&& latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
				? [latitude, longitude]
				: null;
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

		<Map {results} selectedId={selectedResultId} {selectedCoordinates} onSelect={selectProperty} />

		{#if retrieving}
			<p class="loading">Retrieving address...</p>
		{/if}

		{#if selectedAddress}
			<div class="selected-address">
				<h2>Verified Address</h2>

				{#if selectedAddress.match}
					{@const m = selectedAddress.match}

					<!-- Formatted address using LOQATE AddressFormat field -->
					{#if m.AddressFormat}
						<div class="formatted-address">
							{#each m.AddressFormat.split(/<br\s*\/?>/i) as formatLine}
								{@const fields = formatLine.trim().split(/\s+/)}
								{@const lineContent = fields.map((field: string) => {
									if (field === '-') return '';
									const val = m[field];
									return val ? val : '';
								}).filter(Boolean).join(' ')}
								{#if lineContent}
									<p class="address-line">{lineContent}</p>
								{/if}
							{/each}
						</div>
					{:else}
						<p class="address">{m.Address || ''}</p>
					{/if}

					<div class="verification-badges">
						{#if m.AQI}
							<span class="badge" class:verified={m.AQI === 'A'}>AQI: {m.AQI}</span>
						{/if}
						{#if m.AVC}
							<span class="badge">AVC: {m.AVC}</span>
						{/if}
						{#if m.MatchScore}
							<span class="badge">Match Score: {m.MatchScore}</span>
						{/if}
					</div>

					<!-- All raw fields -->
					<details class="raw-fields">
						<summary>All Fields</summary>
						<dl class="components">
							{#if m.Address}<dt>Address</dt><dd>{m.Address}</dd>{/if}
							{#if m.Address1}<dt>Address 1</dt><dd>{m.Address1}</dd>{/if}
							{#if m.Address2}<dt>Address 2</dt><dd>{m.Address2}</dd>{/if}
							{#if m.Address3}<dt>Address 3</dt><dd>{m.Address3}</dd>{/if}
							{#if m.Address4}<dt>Address 4</dt><dd>{m.Address4}</dd>{/if}
							{#if m.Address5}<dt>Address 5</dt><dd>{m.Address5}</dd>{/if}
							{#if m.DeliveryAddress}<dt>Delivery Address</dt><dd>{m.DeliveryAddress}</dd>{/if}
							{#if m.DeliveryAddress1}<dt>Delivery Address 1</dt><dd>{m.DeliveryAddress1}</dd>{/if}
							{#if m.DeliveryAddress2}<dt>Delivery Address 2</dt><dd>{m.DeliveryAddress2}</dd>{/if}
							{#if m.Organisation}<dt>Organisation</dt><dd>{m.Organisation}</dd>{/if}
							{#if m.Department}<dt>Department</dt><dd>{m.Department}</dd>{/if}
							{#if m.Building}<dt>Building</dt><dd>{m.Building}</dd>{/if}
							{#if m.Premise}<dt>Premise</dt><dd>{m.Premise}</dd>{/if}
							{#if m.SubBuilding}<dt>Sub Building</dt><dd>{m.SubBuilding}</dd>{/if}
							{#if m.Thoroughfare}<dt>Thoroughfare</dt><dd>{m.Thoroughfare}</dd>{/if}
							{#if m.DependentThoroughfare}<dt>Dependent Thoroughfare</dt><dd>{m.DependentThoroughfare}</dd>{/if}
							{#if m.Locality}<dt>Locality</dt><dd>{m.Locality}</dd>{/if}
							{#if m.DependentLocality}<dt>Dependent Locality</dt><dd>{m.DependentLocality}</dd>{/if}
							{#if m.DoubleDependentLocality}<dt>Double Dependent Locality</dt><dd>{m.DoubleDependentLocality}</dd>{/if}
							{#if m.AdministrativeArea}<dt>Administrative Area</dt><dd>{m.AdministrativeArea}</dd>{/if}
							{#if m.SubAdministrativeArea}<dt>Sub Administrative Area</dt><dd>{m.SubAdministrativeArea}</dd>{/if}
							{#if m.SuperAdministrativeArea}<dt>Super Administrative Area</dt><dd>{m.SuperAdministrativeArea}</dd>{/if}
							{#if m.PostalCode}<dt>Postal Code</dt><dd>{m.PostalCode}</dd>{/if}
							{#if m.PostalCodePrimary}<dt>Postal Code Primary</dt><dd>{m.PostalCodePrimary}</dd>{/if}
							{#if m.PostalCodeSecondary}<dt>Postal Code Secondary</dt><dd>{m.PostalCodeSecondary}</dd>{/if}
							{#if m.PostBox}<dt>Post Box</dt><dd>{m.PostBox}</dd>{/if}
							{#if m.CountryName}<dt>Country Name</dt><dd>{m.CountryName}</dd>{/if}
							{#if m.ISO3166_2}<dt>ISO 3166-2</dt><dd>{m.ISO3166_2}</dd>{/if}
							{#if m.ISO3166_3}<dt>ISO 3166-3</dt><dd>{m.ISO3166_3}</dd>{/if}
							{#if m.ISO3166_N}<dt>ISO 3166-N</dt><dd>{m.ISO3166_N}</dd>{/if}
							{#if m.Latitude}<dt>Latitude</dt><dd>{m.Latitude}</dd>{/if}
							{#if m.Longitude}<dt>Longitude</dt><dd>{m.Longitude}</dd>{/if}
							{#if m.GeoAccuracy}<dt>Geo Accuracy</dt><dd>{m.GeoAccuracy}</dd>{/if}
							{#if m.GeoDistance}<dt>Geo Distance</dt><dd>{m.GeoDistance}</dd>{/if}
							{#if m.AVC}<dt>AVC</dt><dd>{m.AVC}</dd>{/if}
							{#if m.AQI}<dt>AQI</dt><dd>{m.AQI}</dd>{/if}
							{#if m.MatchScore}<dt>Match Score</dt><dd>{m.MatchScore}</dd>{/if}
							{#if m.MatchRuleLabel}<dt>Match Rule</dt><dd>{m.MatchRuleLabel}</dd>{/if}
							{#if m.HyphenClass}<dt>Hyphen Class</dt><dd>{m.HyphenClass}</dd>{/if}
							{#if m.Sequence}<dt>Sequence</dt><dd>{m.Sequence}</dd>{/if}
							{#if m.Type}<dt>Type</dt><dd>{m.Type}</dd>{/if}
							{#if m.DataLevel}<dt>Data Level</dt><dd>{m.DataLevel}</dd>{/if}
						</dl>
					</details>
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

	.formatted-address {
		background: #f8f9fa;
		padding: 15px;
		border-radius: 6px;
		margin-bottom: 15px;
		border-left: 4px solid #0066cc;
	}

	.address-line {
		margin: 4px 0;
		font-size: 15px;
		color: #333;
	}

	.mask-info {
		margin-top: 15px;
		padding-top: 15px;
		border-top: 1px solid #eee;
	}

	.mask-info h3 {
		margin: 0 0 10px 0;
		font-size: 14px;
		color: #666;
	}

	.raw-fields {
		margin-top: 15px;
	}

	.raw-fields summary {
		cursor: pointer;
		color: #666;
		font-size: 14px;
		padding: 8px 0;
	}

	.raw-fields summary:hover {
		color: #333;
	}

	.verification-badges {
		display: flex;
		gap: 10px;
		margin-bottom: 15px;
		flex-wrap: wrap;
	}

	.badge {
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
		background: #e0e0e0;
		color: #333;
	}

	.badge.verified {
		background: #4caf50;
		color: white;
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
