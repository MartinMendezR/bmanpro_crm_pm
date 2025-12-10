import { Model, DataTypes, CreationOptional, Optional } from 'sequelize';
import sequelize from '@/lib/sequelize';
import bcrypt from 'bcryptjs';

// ---------------------------
//  TypeScript Interfaces
// ---------------------------
export interface UserAttributes {
	id: string;
	active?: boolean;
	access?: boolean;
	fName: string;
	lName: string;
	email: string;
	password: string;
	title?: string;
	phone?: string;
	phonePersonal?: string;
	emailPersonal?: string;
	avatar?: string;
	resetToken?: string;
	resetTokenExpire?: Date;
	addDate?: Date;
	delDate?: Date;

	// Roles
	isRoleSystem?: boolean;
	isRoleAdmin?: boolean;
	isRoleSales?: boolean;
	isRoleEstimator?: boolean;
	isRolePM?: boolean;
	isRoleService?: boolean;
	isRoleAccounting?: boolean;

	// Permissions
	authUserAdd?: boolean;
	authUserMod?: boolean;
	authUserDel?: boolean;
	authCompanyAll?: boolean;
	authCompanyAdd?: boolean;
	authCompanyMod?: boolean;
	authCompanyDel?: boolean;
	authContactAdd?: boolean;
	authContactMod?: boolean;
	authContactDel?: boolean;
	authOpportunityAll?: boolean;
	authOpportunityAdd?: boolean;
	authOpportunityMod?: boolean;
	authOpportunityDel?: boolean;
	authQuoteApproval?: boolean;
	authQuoteAdd?: boolean;
	authQuoteMod?: boolean;
	authQuoteDel?: boolean;
	authPOAdd?: boolean;
	authPOMod?: boolean;
	authPODel?: boolean;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'addDate' | 'delDate'> {}

// ---------------------------
//  User Model
// ---------------------------
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
	// Auto-generated
	declare id: CreationOptional<string>;
	declare addDate: CreationOptional<Date>;
	declare delDate: CreationOptional<Date>;

	// Required fields
	declare fName: string;
	declare lName: string;
	declare email: string;
	declare password: string;

	// Optional fields
	declare active?: boolean;
	declare access?: boolean;
	declare title?: string;
	declare phone?: string;
	declare phonePersonal?: string;
	declare emailPersonal?: string;
	declare avatar?: string;
	declare resetToken?: string;
	declare resetTokenExpire?: Date;

	// Roles
	declare isRoleSystem?: boolean;
	declare isRoleAdmin?: boolean;
	declare isRoleSales?: boolean;
	declare isRoleEstimator?: boolean;
	declare isRolePM?: boolean;
	declare isRoleService?: boolean;
	declare isRoleAccounting?: boolean;

	// Permissions
	declare authUserAdd?: boolean;
	declare authUserMod?: boolean;
	declare authUserDel?: boolean;
	declare authCompanyAll?: boolean;
	declare authCompanyAdd?: boolean;
	declare authCompanyMod?: boolean;
	declare authCompanyDel?: boolean;
	declare authContactAdd?: boolean;
	declare authContactMod?: boolean;
	declare authContactDel?: boolean;
	declare authOpportunityAll?: boolean;
	declare authOpportunityAdd?: boolean;
	declare authOpportunityMod?: boolean;
	declare authOpportunityDel?: boolean;
	declare authQuoteApproval?: boolean;
	declare authQuoteAdd?: boolean;
	declare authQuoteMod?: boolean;
	declare authQuoteDel?: boolean;
	declare authPOAdd?: boolean;
	declare authPOMod?: boolean;
	declare authPODel?: boolean;

	// Virtual fields
	get fullName(): string {
		return [this.fName, this.lName].filter(Boolean).join(' ');
	}

	get formalName(): string {
		return [this.lName, this.fName].filter(Boolean).join(', ');
	}

	// Password validation
	async validatePassword(password: string): Promise<boolean> {
		return bcrypt.compare(password, this.password);
	}
}

// ---------------------------
//  Initialize Model
// ---------------------------
User.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		access: { type: DataTypes.BOOLEAN, defaultValue: true },

		fName: { type: DataTypes.STRING(100), allowNull: false },
		lName: { type: DataTypes.STRING(100), allowNull: false },
		email: { type: DataTypes.STRING(150), allowNull: false },
		password: { type: DataTypes.STRING(80), allowNull: false },

		title: { type: DataTypes.STRING(150) },
		phone: { type: DataTypes.STRING(25) },
		phonePersonal: { type: DataTypes.STRING(25) },
		emailPersonal: { type: DataTypes.STRING(150) },
		avatar: { type: DataTypes.TEXT },

		// Roles
		isRoleSystem: { type: DataTypes.BOOLEAN, defaultValue: false },
		isRoleAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
		isRoleSales: { type: DataTypes.BOOLEAN, defaultValue: false },
		isRoleEstimator: { type: DataTypes.BOOLEAN, defaultValue: false },
		isRolePM: { type: DataTypes.BOOLEAN, defaultValue: false },
		isRoleService: { type: DataTypes.BOOLEAN, defaultValue: false },
		isRoleAccounting: { type: DataTypes.BOOLEAN, defaultValue: false },

		// Permissions
		authUserAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authUserMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authUserDel: { type: DataTypes.BOOLEAN, defaultValue: false },
		authCompanyAll: { type: DataTypes.BOOLEAN, defaultValue: false },
		authCompanyAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authCompanyMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authCompanyDel: { type: DataTypes.BOOLEAN, defaultValue: false },
		authContactAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authContactMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authContactDel: { type: DataTypes.BOOLEAN, defaultValue: false },
		authOpportunityAll: { type: DataTypes.BOOLEAN, defaultValue: false },
		authOpportunityAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authOpportunityMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authOpportunityDel: { type: DataTypes.BOOLEAN, defaultValue: false },
		authQuoteApproval: { type: DataTypes.BOOLEAN, defaultValue: false },
		authQuoteAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authQuoteMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authQuoteDel: { type: DataTypes.BOOLEAN, defaultValue: false },
		authPOAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authPOMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authPODel: { type: DataTypes.BOOLEAN, defaultValue: false },

		resetToken: { type: DataTypes.STRING },
		resetTokenExpire: { type: DataTypes.DATE },

		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		delDate: { type: DataTypes.DATE }
	},
	{
		sequelize,
		modelName: 'User',
		tableName: 'users'
	}
);

// ---------------------------
//  Hooks for async password hashing
// ---------------------------
User.beforeCreate(async (user) => {
	if (user.password) user.password = await bcrypt.hash(user.password, 10);
});

User.beforeUpdate(async (user) => {
	if (user.changed('password') && user.password) {
		user.password = await bcrypt.hash(user.password, 10);
	}
});

export default User;
