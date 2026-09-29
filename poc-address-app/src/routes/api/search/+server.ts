import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { AddressResult } from '$lib/types';

const LOQATE_API_KEY = process.env.LOQATE_API_KEY || 'BY92-NN99-ER43-XT19';
const LOQATE_FIND_URL = 'https://api.addressy.com/Capture/Interactive/Find/v1.20/json6.ws';

interface LoqateItem {
	Id: string;
	Type: string;
	Text: string;
	Description: string;
	Highlight?: string;
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
		const countryCode = country === 'United Kingdom' ? 'GB' : country.substring(0, 2).toUpperCase();

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

		return json({ results });
	} catch (err) {
		console.error('LOQATE search error:', err);
		throw error(500, 'Failed to search addresses');
	}
};
