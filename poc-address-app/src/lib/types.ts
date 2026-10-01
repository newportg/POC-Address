export interface Country {
	name: string;
	code: string;
	flag: string;
}

export interface AddressResult {
	id: string;
	text: string;
	description?: string;
	latitude?: number;
	longitude?: number;
}

export interface SearchResponse {
	results: AddressResult[];
}
