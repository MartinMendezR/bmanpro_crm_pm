import { initDB } from '@/lib/sequelize';
import { User } from '@/models/user';

export async function GET() {
	await initDB(); // Runs once, safe to call on every request

	const users = await User.findAll();
	return Response.json(users);
}

export async function POST(req: Request) {
	await initDB();
	const { fName, lName } = await req.json();

	const user = await User.create({ fName, lName });
	return Response.json(user);
}
