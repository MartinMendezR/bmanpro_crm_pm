import { NextResponse } from 'next/server';
import { initDB } from '@/lib/sequelize';

export async function GET() {
	try {
		await initDB();
		return NextResponse.json({ ok: true, message: 'Database initialized' });
	} catch (err: any) {
		console.error('initDB API error:', err);
		return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
	}
}
