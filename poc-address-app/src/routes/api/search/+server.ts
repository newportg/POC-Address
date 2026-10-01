import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { AddressResult } from '$lib/types';
import { getCachedResponse, setCachedResponse } from '$lib/cache';

const LOQATE_API_KEY = process.env.LOQATE_API_KEY || 'BY92-NN99-ER43-XT19';
const LOQATE_FIND_URL = 'https://api.addressy.com/Capture/Interactive/Find/v1.20/json6.ws';
const LOQATE_VERIFY_URL = 'https://api.addressy.com/Cleansing/International/Batch/v1.20/json6.ws';

// Country name to ISO 3166-1 alpha-2 code mapping
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
	'united kingdom': 'GB',
	'united states': 'US',
	'germany': 'DE',
	'france': 'FR',
	'spain': 'ES',
	'italy': 'IT',
	'netherlands': 'NL',
	'belgium': 'BE',
	'ireland': 'IE',
	'portugal': 'PT',
	'austria': 'AT',
	'switzerland': 'CH',
	'poland': 'PL',
	'sweden': 'SE',
	'norway': 'NO',
	'denmark': 'DK',
	'finland': 'FI',
	'australia': 'AU',
	'canada': 'CA',
	'new zealand': 'NZ',
};

interface LoqateItem {
	Id: string;
	Type: string;
	Text: string;
	Description: string;
	Highlight?: string;
}

function getCoordinates(match: any): [number, number] | null {
	const latitude = Number(match?.Latitude);
	const longitude = Number(match?.Longitude);
	if (
		match?.Latitude == null || String(match.Latitude).trim() === '' ||
		match?.Longitude == null || String(match.Longitude).trim() === '' ||
		!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
		latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
	) {
		return null;
	}
	return [latitude, longitude];
}

async function geocodeResults(results: AddressResult[], country: string): Promise<AddressResult[]> {
	const pending: AddressResult[] = [];
	const coordinatesById = new Map<string, [number, number]>();

	for (const result of results) {
		const cached = getCachedResponse(result.id);
		const coordinates = getCoordinates(cached?.match);
		if (coordinates) {
			coordinatesById.set(result.id, coordinates);
		} else {
			pending.push(result);
		}
	}

	if (pending.length > 0) {
		const response = await fetch(LOQATE_VERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				Key: LOQATE_API_KEY,
				GeoCode: true,
				Addresses: pending.map((result) => ({
					Id: result.id,
					Address: [result.text, result.description].filter(Boolean).join(', '),
					Address1: result.text,
					Locality: result.description || '',
					Country: country,
				})),
				Options: {
					Process: 'Verify',
					Enhance: false,
					ServerOptions: { OutputAddressFormat: 'YES' },
				},
			}),
		});

		const data = await response.json();
		const verifyItems: any[] = Array.isArray(data) ? data : data.Items || [];
		if (!response.ok || verifyItems.length === 0) {
			throw new Error(data.Description || 'LOQATE geocoding failed');
		}

		const verifyItemsById = new Map<string, any>();
		verifyItems.forEach((item, index) => {
			const id = item.Input?.Id || pending[index]?.id;
			if (id) verifyItemsById.set(id, item);
		});

		pending.forEach((result, index) => {
			const item = verifyItemsById.get(result.id) || verifyItems[index];
			const match = item?.Matches?.[0] || item;
			if (!match || item?.Error) return;

			const coordinates = getCoordinates(match);
			if (coordinates) coordinatesById.set(result.id, coordinates);
			setCachedResponse(result.id, {
				id: result.id,
				input: item.Input || {},
				match,
			});
		});
	}

	return results.map((result) => {
		const coordinates = coordinatesById.get(result.id);
		return coordinates
			? { ...result, latitude: coordinates[0], longitude: coordinates[1] }
			: result;
	});
}

async function loqateFind(text: string, container?: string, countries?: string): Promise<LoqateItem[]> {
	const url = new URL(LOQATE_FIND_URL);
	url.searchParams.set('Key', LOQATE_API_KEY);
	url.searchParams.set('Text', text);
	if (container) url.searchParams.set('Container', container);
	if (countries) url.searchParams.set('Countries', countries);
	url.searchParams.set('Limit', '100');

	const response = await fetch(url.toString());
	const data = await response.json();

	if (!response.ok || data.Items?.[0]?.Error) {
		throw new Error(data.Items?.[0]?.Description || 'LOQATE API error');
	}

	return data.Items || [];
}

export const GET: RequestHandler = async ({ url }) => {
	const country = url.searchParams.get('country');
	const query = url.searchParams.get('query');

	if (!country || !query) {
		throw error(400, 'Missing required parameters: country and query');
	}

	try {
		// Map country name to ISO code for LOQATE
		const countryCode = COUNTRY_NAME_TO_ISO[country.toLowerCase()] || country.substring(0, 2).toUpperCase();

		// First search
		let items = await loqateFind(query, undefined, countryCode);

		// Recursively drill down through containers until we get addresses
		let maxDepth = 5;
		while (maxDepth > 0 && items.length > 0 && items[0].Type !== 'Address') {
			const containerId = items[0].Id;
			items = await loqateFind(query, containerId, countryCode);
			maxDepth--;
		}

		const results: AddressResult[] = items
			.filter((item: LoqateItem) => item.Type === 'Address')
			.map((item: LoqateItem) => ({
				id: item.Id,
				text: item.Text,
				description: item.Description,
			}));

		let geocodedResults = results;
		try {
			geocodedResults = await geocodeResults(results, countryCode);
		} catch (err) {
			console.error('LOQATE search geocoding error:', err);
		}

		return json({ results: geocodedResults });
	} catch (err) {
		console.error('LOQATE search error:', err);
		throw error(500, 'Failed to search addresses');
	}
};
