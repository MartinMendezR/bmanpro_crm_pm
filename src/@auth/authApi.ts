import type { User } from '@/models/user';
import { PartialDeep } from 'type-fest';
import api from '@/utils/api';

/**
 * Get user by id
 */
export async function authGetDbUser(userId: string): Promise<Response> {
	return api.get(`mock/auth/user/${userId}`);
}

/**
 * Get user by email
 */
export async function authGetDbUserByEmail(email: string): Promise<Response> {
	return api.get(`mock/auth/user-by-email/${email}`);
}

/**
 * Update user
 */
export function authUpdateDbUser(user: PartialDeep<User>) {
	return api.put(`mock/auth/user/${user.id}`, {
		body: JSON.stringify(user)
	});
}

/**
 * Create user
 */
export async function authCreateDbUser(user: PartialDeep<User>) {
	return api.post('mock/users', {
		body: JSON.stringify(user)
	});
}
