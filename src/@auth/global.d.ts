import type { User } from '@/models/user';

declare module 'next-auth' {
	interface Session {
		accessToken?: string;
		db: User;
	}
	interface JWT {
		accessToken?: string;
	}
}
