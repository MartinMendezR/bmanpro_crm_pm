// types/UserFrontend.ts
import { UserAttributes } from '@/models/user';

// Pick only the minimal fields for the frontend
export type UserPublic = Pick<
	UserAttributes,
	| 'id'
	| 'fName'
	| 'lName'
	| 'email'
	| 'isRoleSystem'
	| 'isRoleAdmin'
	| 'isRoleSales'
	| 'isRoleEstimator'
	| 'isRolePurchasing'
	| 'isRolePM'
	| 'isRoleService'
>;
