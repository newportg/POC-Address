import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const COUNTRIES = [
	{ name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
	{ name: 'United States', code: 'US', flag: '🇺🇸' },
	{ name: 'Germany', code: 'DE', flag: '🇩🇪' },
	{ name: 'France', code: 'FR', flag: '🇫🇷' },
	{ name: 'Spain', code: 'ES', flag: '🇪🇸' },
	{ name: 'Italy', code: 'IT', flag: '🇮🇹' },
	{ name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
	{ name: 'Belgium', code: 'BE', flag: '🇧🇪' },
	{ name: 'Ireland', code: 'IE', flag: '🇮🇪' },
	{ name: 'Portugal', code: 'PT', flag: '🇵🇹' },
	{ name: 'Austria', code: 'AT', flag: '🇦🇹' },
	{ name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
	{ name: 'Poland', code: 'PL', flag: '🇵🇱' },
	{ name: 'Sweden', code: 'SE', flag: '🇸🇪' },
	{ name: 'Norway', code: 'NO', flag: '🇳🇴' },
	{ name: 'Denmark', code: 'DK', flag: '🇩🇰' },
	{ name: 'Finland', code: 'FI', flag: '🇫🇮' },
	{ name: 'Australia', code: 'AU', flag: '🇦🇺' },
	{ name: 'Canada', code: 'CA', flag: '🇨🇦' },
	{ name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
];

export const GET: RequestHandler = async () => {
	return json(COUNTRIES);
};
