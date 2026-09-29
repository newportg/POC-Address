<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AddressResult } from './types';

	let mapContainer: HTMLDivElement;
	let map: any;
	let L: any = null;
	let markers: Map<string, any> = new Map();
	let selectedMarkerId: string | null = null;
	let pendingSelectedId: string | null = null;

	let { results, selectedId, onSelect }: {
		results: AddressResult[];
		selectedId?: string | null;
		onSelect?: (result: AddressResult) => void;
	} = $props();

	onMount(async () => {
		// Import Leaflet
		L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		// Initialize map
		map = L.map(mapContainer).setView([52.6784, -2.4453], 13);

		// Add tile layer
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
		}).addTo(map);

		// Plot initial results
		if (results.length > 0) {
			plotResults(results);
		}
	});

	onDestroy(() => {
		map?.remove();
	});

	$effect(() => {
		if (!map || !L || !results.length) return;
		plotResults(results);
	});

	$effect(() => {
		if (!map || !L) return;

		if (selectedId) {
			pendingSelectedId = selectedId;
			applySelection();
		} else {
			clearSelection();
		}
	});

	function plotResults(results: AddressResult[]) {
		if (!L) return;

		// Clear existing markers
		markers.forEach((m) => m.remove());
		markers.clear();
		selectedMarkerId = null;

		const bounds = L.latLngBounds([]);
		let processedCount = 0;

		results.forEach((result, index) => {
			// Use fallback coordinates (geocoding is blocked by CORS)
			const coords = getFallbackCoords(index);

			if (!coords || !map) {
				processedCount++;
				if (processedCount === results.length) {
					fitBounds();
					applySelection();
				}
				return;
			}

			const marker = L.marker(coords)
				.addTo(map)
				.bindPopup(`<strong>${escapeHtml(result.text)}</strong><br>${escapeHtml(result.description || '')}`);

			marker.on('click', () => {
				selectMarker(result.id);
				onSelect?.(result);
			});

			markers.set(result.id, marker);
			bounds.extend(coords);

			processedCount++;
			if (processedCount === results.length) {
				fitBounds();
				applySelection();
			}
		});
	}

	function getFallbackCoords(index: number): [number, number] {
		// Spread markers in a grid pattern to show area coverage
		const baseLat = 52.6784;
		const baseLng = -2.4453;
		const gridSize = Math.ceil(Math.sqrt(100));
		const row = Math.floor(index / gridSize);
		const col = index % gridSize;
		const latOffset = (row - gridSize / 2) * 0.005;
		const lngOffset = (col - gridSize / 2) * 0.005;
		return [baseLat + latOffset, baseLng + lngOffset];
	}

	function applySelection() {
		if (!pendingSelectedId || !map || !L) return;

		const marker = markers.get(pendingSelectedId);
		if (marker) {
			selectMarker(pendingSelectedId);
			map.setView(marker.getLatLng(), 18);
			marker.openPopup();
		}
	}

	function clearSelection() {
		if (!selectedMarkerId || !map || !L) return;

		const prev = markers.get(selectedMarkerId);
		if (prev) {
			prev.setIcon(L.Icon.Default.prototype);
		}
		selectedMarkerId = null;
		pendingSelectedId = null;
	}

	function fitBounds() {
		if (markers.size === 0 || !L || !map) return;

		const bounds = L.latLngBounds([]);
		markers.forEach((m) => bounds.extend(m.getLatLng()));

		// Calculate center and zoom
		const center = bounds.getCenter();
		const zoom = Math.max(map.getBoundsZoom(bounds.pad(0.1), false), 15);

		map.setView(center, zoom, { animate: false });

		// Force re-render
		setTimeout(() => map.invalidateSize(), 100);
	}

	function selectMarker(id: string) {
		if (!L) return;

		// Reset previous marker
		if (selectedMarkerId && markers.has(selectedMarkerId)) {
			const prev = markers.get(selectedMarkerId);
			prev.setIcon(L.Icon.Default.prototype);
		}

		// Highlight new marker
		selectedMarkerId = id;
		const marker = markers.get(id);
		if (marker) {
			marker.setIcon(L.divIcon({
				className: 'selected-marker',
				html: '<div style="background:#ff6600;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
				iconSize: [30, 30],
				iconAnchor: [15, 30],
			}));
		}
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
