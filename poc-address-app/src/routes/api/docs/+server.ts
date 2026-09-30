import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({
		openapi: '3.0.0',
		info: {
			title: 'POC Address API',
			description: 'Address search and verification API using LOQATE services',
			version: '1.0.0',
		},
		servers: [
			{
				url: '/api',
				description: 'API Base URL',
			},
		],
		paths: {
			'/countries': {
				get: {
					summary: 'Get countries',
					description: 'Returns a list of countries with their flags and ISO codes',
					responses: {
						'200': {
							description: 'List of countries',
							content: {
								'application/json': {
									schema: {
										type: 'array',
										items: {
											type: 'object',
											properties: {
												name: { type: 'string' },
												code: { type: 'string' },
												flag: { type: 'string' },
											},
										},
									},
								},
							},
						},
					},
				},
			},
			'/search': {
				get: {
					summary: 'Search addresses',
					description: 'Search for addresses using LOQATE Find API. Returns matching addresses for a given country and search query.',
					parameters: [
						{
							name: 'country',
							in: 'query',
							required: true,
							schema: { type: 'string' },
							description: 'Country name (e.g., "United Kingdom")',
						},
						{
							name: 'query',
							in: 'query',
							required: true,
							schema: { type: 'string' },
							description: 'Search query (e.g., postcode or address text)',
						},
					],
					responses: {
						'200': {
							description: 'Search results',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											results: {
												type: 'array',
												items: {
													type: 'object',
													properties: {
														id: { type: 'string' },
														text: { type: 'string' },
														description: { type: 'string' },
													},
												},
											},
										},
									},
								},
							},
						},
						'400': {
							description: 'Missing required parameters',
						},
					},
				},
			},
			'/retrieve': {
				get: {
					summary: 'Get verified address details',
					description: 'Get verified address details using LOQATE Verify API. Returns full address components, geocoding data, and verification codes.',
					parameters: [
						{
							name: 'id',
							in: 'query',
							required: true,
							schema: { type: 'string' },
							description: 'Address ID from search results',
						},
						{
							name: 'text',
							in: 'query',
							required: true,
							schema: { type: 'string' },
							description: 'Address text',
						},
						{
							name: 'description',
							in: 'query',
							required: false,
							schema: { type: 'string' },
							description: 'Address description (locality, postcode)',
						},
					],
					responses: {
						'200': {
							description: 'Verified address details',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											input: { type: 'object' },
											match: {
												type: 'object',
												properties: {
													Address: { type: 'string' },
													Address1: { type: 'string' },
													Address2: { type: 'string' },
													Organisation: { type: 'string' },
													Building: { type: 'string' },
													Premise: { type: 'string' },
													Thoroughfare: { type: 'string' },
													Locality: { type: 'string' },
													PostalCode: { type: 'string' },
													CountryName: { type: 'string' },
													Latitude: { type: 'string' },
													Longitude: { type: 'string' },
													AVC: { type: 'string' },
													AQI: { type: 'string' },
												},
											},
										},
									},
								},
							},
						},
						'404': {
							description: 'Address not found',
						},
					},
				},
			},
		},
	});
};
