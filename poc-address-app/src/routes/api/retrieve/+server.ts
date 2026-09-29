import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const LOQATE_API_KEY = process.env.LOQATE_API_KEY || 'BY92-NN99-ER43-XT19';
const LOQATE_RETRIEVE_URL = 'https://api.addressy.com/Capture/Interactive/Retrieve/v1.30/json6.ws';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');

	if (!id) {
		throw error(400, 'Missing required parameter: id');
	}

	try {
		const loqateUrl = new URL(LOQATE_RETRIEVE_URL);
		loqateUrl.searchParams.set('Key', LOQATE_API_KEY);
		loqateUrl.searchParams.set('Id', id);

		const response = await fetch(loqateUrl.toString());
		const data = await response.json();

		if (!response.ok || data.Items?.[0]?.Error) {
			throw error(404, data.Items?.[0]?.Description || 'Address not found');
		}

		const item = data.Items[0];
		return json({
			id: item.Id,
			label: item.Label || '',
			address: [item.Line1, item.Line2, item.Line3, item.Line4, item.Line5].filter(Boolean).join(', '),
			components: {
				organisation: item.Company || '',
				department: item.Department || '',
				subBuilding: item.SubBuilding || '',
				buildingName: item.BuildingName || '',
				buildingNumber: item.BuildingNumber || '',
				street: item.Street || '',
				district: item.District || '',
				city: item.City || '',
				province: item.Province || '',
				postalCode: item.PostalCode || '',
				country: item.CountryName || '',
			},
			type: item.Type || '',
			dataLevel: item.DataLevel || '',
		});
	} catch (err) {
		console.error('LOQATE retrieve error:', err);
		throw error(500, 'Failed to retrieve address');
	}
};
