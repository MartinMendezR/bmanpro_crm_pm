import database from '@/lib/database';

let initialized = false;

export const initDatabase = async () => {
	if (initialized) return;

	initialized = true;

	try {
		const result = await database.init();
		console.log('DB initialized:', result.message);
	} catch (err) {
		console.error('DB init failed:', err);
		process.exit(1);
	}
};

initDatabase();
