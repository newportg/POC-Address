<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AddressResult } from './types';

	let mapContainer: HTMLDivElement;
	let map: any;
	let L: any = null;
	let markers: Map<string, any> = new Map();
	let mapReady = false;

	let { results, selectedId, selectedCoordinates, onSelect }: {
		results: AddressResult[];
		selectedId?: string | null;
		selectedCoordinates?: [number, number] | null;
		onSelect?: (result: AddressResult) => void;
	} = $props();

	onMount(async () => {
		// Import Leaflet
		L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		// Initialize map at world view
		map = L.map(mapContainer).setView([20, 0], 2);

		// Add tile layer
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
		}).addTo(map);

		// Mark map as ready
		mapReady = true;

		// Initial render
		renderResults();
	});

	onDestroy(() => {
		map?.remove();
	});

	// Rebuild markers and fit the complete result set when search results change.
	$effect(() => {
		results;
		renderResults();
	});

	// Keep selection movement independent from fitting the search-result bounds.
	$effect(() => {
		updateSelection(selectedId, selectedCoordinates);
	});

	function renderResults() {
		if (!mapReady || !map || !L) return;

		// Clear existing markers
		markers.forEach((m) => m.remove());
		markers.clear();

		const bounds = L.latLngBounds([]);

		// Fit the map to the real geocodes returned for the search results.
		results.forEach((result) => {
			const coordinates = getResultCoordinates(result);
			if (coordinates) bounds.extend(coordinates);
		});

		if (bounds.isValid()) {
			map.fitBounds(bounds.pad(0.1), { animate: true, maxZoom: 16 });
		}
	}

	function updateSelection(id?: string | null, coordinates?: [number, number] | null) {
		if (!mapReady || !map || !L) return;

		markers.forEach((existingMarker, markerId) => {
			if (markerId !== id) {
				existingMarker.remove();
				markers.delete(markerId);
			}
		});
		if (!id) return;

		const result = results.find((item) => item.id === id);
		if (!result) return;
		const markerCoordinates = coordinates ?? getResultCoordinates(result);
		if (!markerCoordinates) return;

		let marker = markers.get(id);
		if (!marker) {
			marker = L.marker(markerCoordinates)
				.addTo(map)
				.bindPopup(`<strong>${escapeHtml(result.text)}</strong><br>${escapeHtml(result.description || '')}`);
			marker.on('click', () => onSelect?.(result));
			markers.set(id, marker);
		}

		if (coordinates) marker.setLatLng(coordinates);
		marker.setIcon(L.divIcon({
			className: 'selected-marker',
			html: '<div style="background:#ff6600;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
			iconSize: [30, 30],
			iconAnchor: [15, 30],
		}));
		map.stop();
		map.setView(marker.getLatLng(), 18, { animate: true });
		marker.openPopup();
	}

	function getResultCoordinates(result: AddressResult): [number, number] | null {
		const { latitude, longitude } = result;
		if (
			typeof latitude !== 'number' || typeof longitude !== 'number' ||
			!Number.isFinite(latitude) || !Number.isFinite(longitude)
		) {
			return null;
		}
		return [latitude, longitude];
	}

	function escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}
</script>

<div class="map-container">
	<div bind:this={mapContainer} class="map"></div>
</div>

<style>
	.map-container {
		margin-top: 20px;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.map {
		height: 400px;
		width: 100%;
	}

	:global(.selected-marker) {
		background: transparent;
		border: none;
	}
</style>
