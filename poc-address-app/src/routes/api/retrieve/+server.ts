import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const LOQATE_API_KEY = process.env.LOQATE_API_KEY || 'BY92-NN99-ER43-XT19';
const LOQATE_VERIFY_URL = 'https://api.addressy.com/Cleansing/International/Batch/v1.20/json6.ws';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	const text = url.searchParams.get('text');
	const description = url.searchParams.get('description');
	const country = url.searchParams.get('country') || 'United Kingdom';

	if (!id) {
		throw error(400, 'Missing required parameter: id');
	}

	try {
		// Construct full address from text and description
		const fullAddress = [text, description].filter(Boolean).join(', ');

		const payload = {
			Key: LOQATE_API_KEY,
			GeoCode: true,
			Addresses: [
				{
					Id: id,
					Address: fullAddress,
					Address1: text || '',
					Locality: description || '',
					Country: country,
				},
			],
			Options: {
				Process: 'Verify',
				Enhance: false,
				ServerOptions: {
					OutputAddressFormat: 'YES',
				},
			},
		};

		const response = await fetch(LOQATE_VERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		const data = await response.json();

		// Verify API returns an array of results
		const item = Array.isArray(data) ? data[0] : data.Items?.[0];
		const match = item?.Matches?.[0] || item;

		if (!item || item.Error) {
			throw error(404, item?.Description || 'Address not found');
		}

		// Return all fields from the verify response
		return json({
			id: item.Id || id,
			input: item.Input || {},
			match: match || {},
		});
	} catch (err) {
		console.error('LOQATE verify error:', err);
		throw error(500, 'Failed to verify address');
	}
};
