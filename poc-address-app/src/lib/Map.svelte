<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AddressResult } from './types';

	let mapContainer: HTMLDivElement;
	let map: any;
	let L: any = null;
	let markers: Map<string, any> = new Map();
	let selectedMarkerId: string | null = null;
	let mapReady = false;

	let { results, selectedId, onSelect }: {
		results: AddressResult[];
		selectedId?: string | null;
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
		render();
	});

	onDestroy(() => {
		map?.remove();
	});

	// Watch for changes and re-render
	$effect(() => {
		render();
	});

	function render() {
		if (!mapReady || !map || !L) return;

		// Clear existing markers
		markers.forEach((m) => m.remove());
		markers.clear();
		selectedMarkerId = null;

		const bounds = L.latLngBounds([]);

		// Add markers for each result
		results.forEach((result, index) => {
			const coords = getFallbackCoords(index, result.text);

			const marker = L.marker(coords)
				.addTo(map)
				.bindPopup(`<strong>${escapeHtml(result.text)}</strong><br>${escapeHtml(result.description || '')}`);

			marker.on('click', () => {
				onSelect?.(result);
			});

			markers.set(result.id, marker);
			bounds.extend(coords);
		});

		// Zoom to fit all markers
		if (markers.size > 0) {
			map.fitBounds(bounds.pad(0.1), { animate: true });
		}

		// Handle selection
		if (selectedId) {
			const marker = markers.get(selectedId);
			if (marker) {
				selectedMarkerId = selectedId;
				marker.setIcon(L.divIcon({
					className: 'selected-marker',
					html: '<div style="background:#ff6600;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
					iconSize: [30, 30],
					iconAnchor: [15, 30],
				}));
				map.setView(marker.getLatLng(), 18, { animate: true });
				marker.openPopup();
			}
		}
	}

	function getFallbackCoords(index: number, text: string): [number, number] {
		// Generate a hash from the address text to create a unique location per search
		let hash = 0;
		for (let i = 0; i < text.length; i++) {
			hash = ((hash << 5) - hash) + text.charCodeAt(i);
			hash = hash & hash;
		}

		// Use hash to create a base location (spread across UK)
		const baseLat = 51.5 + (hash % 100) / 100;
		const baseLng = -1.5 + ((hash >> 8) % 100) / 100;

		// Spread markers in a grid pattern around the base location
		const gridSize = Math.ceil(Math.sqrt(100));
		const row = Math.floor(index / gridSize);
		const col = index % gridSize;
		const latOffset = (row - gridSize / 2) * 0.003;
		const lngOffset = (col - gridSize / 2) * 0.003;

		return [baseLat + latOffset, baseLng + lngOffset];
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
