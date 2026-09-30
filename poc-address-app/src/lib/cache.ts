import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), '.cache', 'address-cache.db');

// Ensure cache directory exists
const cacheDir = path.dirname(DB_PATH);
if (!fs.existsSync(cacheDir)) {
	fs.mkdirSync(cacheDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Create cache table if it doesn't exist
db.exec(`
	CREATE TABLE IF NOT EXISTS address_cache (
		id TEXT PRIMARY KEY,
		response TEXT NOT NULL,
		created_at INTEGER NOT NULL
	)
`);

export function getCachedResponse(id: string): any | null {
	const row = db.prepare('SELECT response FROM address_cache WHERE id = ?').get(id) as any;
	if (row) {
		return JSON.parse(row.response);
	}
	return null;
}

export function setCachedResponse(id: string, response: any): void {
	const now = Date.now();
	db.prepare(`
		INSERT OR REPLACE INTO address_cache (id, response, created_at)
		VALUES (?, ?, ?)
	`).run(id, JSON.stringify(response), now);
}

export function clearCache(): void {
	db.prepare('DELETE FROM address_cache').run();
}

export function getCacheStats(): { count: number; size: number } {
	const count = (db.prepare('SELECT COUNT(*) as count FROM address_cache').get() as any).count;
	const size = fs.statSync(DB_PATH).size;
	return { count, size };
}
