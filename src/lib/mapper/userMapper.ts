import { User } from '@/models/user';
import { UserPublic } from '@/types/UserFrontend';

export const toPublicUser = (user: User): UserPublic => ({
	id: user.id,
	fName: user.fName,
	lName: user.lName,
	email: user.email,
	isRoleSystems: user.isRoleSystems,
	isRoleAdmin: user.isRoleAdmin,
	isRoleSales: user.isRoleSales,
	isRoleEstimating: undefined,
	isRoleProjects: undefined,
	isRoleSupport: undefined
});

export const toPublicUsers = (users: User[]): UserPublic[] => users.map(toPublicUser);
