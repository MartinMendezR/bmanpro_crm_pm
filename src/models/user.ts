import { DataTypes, CreationOptional, Optional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '@/lib/sequelize';
import bcrypt from 'bcryptjs';
import { BaseModel } from './_baseModel';

export interface UserCreationAttributes extends Optional<InferCreationAttributes<User>, 'id' | 'addDate' | 'delDate'> {}

export class User extends BaseModel<InferAttributes<User>, InferCreationAttributes<User>> {
	declare id: CreationOptional<string>;

	declare fName: string;
	declare lName: string;
	declare email: string;
	declare password: string;

	declare access: CreationOptional<boolean>;
	declare title?: string;
	declare phone?: string;
	declare phonePersonal?: string;
	declare emailPersonal?: string;
	declare avatar?: string;
	declare resetToken?: string;
	declare resetTokenExpire?: Date;

	declare isRoleSystem: CreationOptional<boolean>;
	declare isRoleAdmin: CreationOptional<boolean>;
	declare isRoleSales: CreationOptional<boolean>;
	declare isRoleEstimator: CreationOptional<boolean>;
	declare isRolePM: CreationOptional<boolean>;
	declare isRoleService: CreationOptional<boolean>;
	declare isRoleAccounting: CreationOptional<boolean>;

	declare authUserAdd: CreationOptional<boolean>;
	declare authUserMod: CreationOptional<boolean>;
	declare authUserDel: CreationOptional<boolean>;

	declare authCompanyAll: CreationOptional<boolean>;
	declare authCompanyAdd: CreationOptional<boolean>;
	declare authCompanyMod: CreationOptional<boolean>;
	declare authCompanyDel: CreationOptional<boolean>;

	declare authContactAll: CreationOptional<boolean>;
	declare authContactAdd: CreationOptional<boolean>;
	declare authContactMod: CreationOptional<boolean>;
	declare authContactDel: CreationOptional<boolean>;

	declare authOpportunityAll: CreationOptional<boolean>;
	declare authOpportunityAdd: CreationOptional<boolean>;
	declare authOpportunityMod: CreationOptional<boolean>;
	declare authOpportunityDel: CreationOptional<boolean>;

	declare authQuoteAll: CreationOptional<boolean>;
	declare authQuoteAdd: CreationOptional<boolean>;
	declare authQuoteMod: CreationOptional<boolean>;
	declare authQuoteDel: CreationOptional<boolean>;
	declare authQuoteApproval: CreationOptional<boolean>;

	declare authPOAll: CreationOptional<boolean>;
	declare authPOAdd: CreationOptional<boolean>;
	declare authPOMod: CreationOptional<boolean>;
	declare authPODel: CreationOptional<boolean>;

	declare authProjectAll: CreationOptional<boolean>;
	declare authProjectAdd: CreationOptional<boolean>;
	declare authProjectMod: CreationOptional<boolean>;
	declare authProjectDel: CreationOptional<boolean>;

	declare authExpensestAll: CreationOptional<boolean>;
	declare authExpensestAdd: CreationOptional<boolean>;
	declare authExpensestMod: CreationOptional<boolean>;
	declare authExpensestDel: CreationOptional<boolean>;

	declare fullName: string;
	declare formalName: string;

	declare roles: {
		system: boolean;
		admin: boolean;
		sales: boolean;
		estimator: boolean;
		pm: boolean;
		service: boolean;
		accounting: boolean;
	};

	declare permissions: {
		user: { add: boolean; mod: boolean; del: boolean };
		company: { all: boolean; add: boolean; mod: boolean; del: boolean };
		contact: { all: boolean; add: boolean; mod: boolean; del: boolean };
		opportunity: { all: boolean; add: boolean; mod: boolean; del: boolean };
		quote: { all: boolean; add: boolean; mod: boolean; del: boolean; approval: boolean };
		po: { all: boolean; add: boolean; mod: boolean; del: boolean };
		project: { all: boolean; add: boolean; mod: boolean; del: boolean };
		expense: { all: boolean; add: boolean; mod: boolean; del: boolean };
	};

	/* Password check */
	async validatePassword(password: string) {
		return bcrypt.compare(password, this.password);
	}
}

User.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

		access: { type: DataTypes.BOOLEAN, defaultValue: true },

		fName: { type: DataTypes.STRING(100), allowNull: false },
		lName: { type: DataTypes.STRING(100), allowNull: false },
		email: { type: DataTypes.STRING(150), allowNull: false },
		password: { type: DataTypes.STRING(80), allowNull: false },

		title: DataTypes.STRING(150),
		phone: DataTypes.STRING(25),
		phonePersonal: DataTypes.STRING(25),
		emailPersonal: DataTypes.STRING(150),
		avatar: DataTypes.TEXT,

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

		authContactAll: { type: DataTypes.BOOLEAN, defaultValue: false },
		authContactAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authContactMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authContactDel: { type: DataTypes.BOOLEAN, defaultValue: false },

		authOpportunityAll: { type: DataTypes.BOOLEAN, defaultValue: false },
		authOpportunityAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authOpportunityMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authOpportunityDel: { type: DataTypes.BOOLEAN, defaultValue: false },

		authQuoteAll: { type: DataTypes.BOOLEAN, defaultValue: false },
		authQuoteAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authQuoteMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authQuoteDel: { type: DataTypes.BOOLEAN, defaultValue: false },
		authQuoteApproval: { type: DataTypes.BOOLEAN, defaultValue: false },

		authPOAll: { type: DataTypes.BOOLEAN, defaultValue: false },
		authPOAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authPOMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authPODel: { type: DataTypes.BOOLEAN, defaultValue: false },

		authProjectAll: { type: DataTypes.BOOLEAN, defaultValue: false },
		authProjectAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authProjectMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authProjectDel: { type: DataTypes.BOOLEAN, defaultValue: false },

		authExpensestAll: { type: DataTypes.BOOLEAN, defaultValue: false },
		authExpensestAdd: { type: DataTypes.BOOLEAN, defaultValue: false },
		authExpensestMod: { type: DataTypes.BOOLEAN, defaultValue: false },
		authExpensestDel: { type: DataTypes.BOOLEAN, defaultValue: false },

		resetToken: DataTypes.STRING,
		resetTokenExpire: DataTypes.DATE,

		// Audit fields
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		addUserId: { type: DataTypes.UUID, allowNull: false },
		delUserId: DataTypes.UUID,
		delDate: DataTypes.DATE,

		// Virtual fields
		fullName: {
			type: DataTypes.VIRTUAL,
			get() {
				return `${this.fName} ${this.lName}`.trim();
			}
		},
		formalName: {
			type: DataTypes.VIRTUAL,
			get() {
				return `${this.lName}, ${this.fName}`.trim();
			}
		},
		roles: {
			type: DataTypes.VIRTUAL,
			get() {
				return {
					system: this.isRoleSystem,
					admin: this.isRoleAdmin,
					sales: this.isRoleSales,
					estimator: this.isRoleEstimator,
					pm: this.isRolePM,
					service: this.isRoleService,
					accounting: this.isRoleAccounting
				};
			}
		},
		permissions: {
			type: DataTypes.VIRTUAL,
			get() {
				return {
					user: {
						add: this.authUserAdd,
						mod: this.authUserMod,
						del: this.authUserDel
					},
					company: {
						all: this.authCompanyAll,
						add: this.authCompanyAdd,
						mod: this.authCompanyMod,
						del: this.authCompanyDel
					},
					contact: {
						add: this.authContactAdd,
						mod: this.authContactMod,
						del: this.authContactDel
					},
					opportunity: {
						all: this.authOpportunityAll,
						add: this.authOpportunityAdd,
						mod: this.authOpportunityMod,
						del: this.authOpportunityDel
					},
					quote: {
						approval: this.authQuoteApproval,
						add: this.authQuoteAdd,
						mod: this.authQuoteMod,
						del: this.authQuoteDel
					},
					po: {
						add: this.authPOAdd,
						mod: this.authPOMod,
						del: this.authPODel
					},
					project: {
						all: this.authProjectAll,
						add: this.authProjectAdd,
						mod: this.authProjectMod,
						del: this.authProjectDel
					},
					expense: {
						all: this.authExpensestAll,
						add: this.authExpensestAdd,
						mod: this.authExpensestMod,
						del: this.authExpensestDel
					}
				};
			}
		}
	},
	{
		sequelize,
		tableName: 'users',
		modelName: 'User',
		timestamps: false,

		defaultScope: {
			attributes: { exclude: ['password', 'resetToken', 'resetTokenExpire'] }
		},

		scopes: {
			password: {
				attributes: [
					'id',
					'active',
					'access',
					'fName',
					'lName',
					'email',
					'password',
					'resetToken',
					'resetTokenExpire'
				]
			},

			read: () => ({
				attributes: { exclude: ['password', 'resetToken', 'resetTokenExpire'] },
				order: [
					['lName', 'ASC'],
					['fName', 'ASC']
				]
			}),

			me: () => ({
				attributes: { exclude: ['password', 'resetToken', 'resetTokenExpire'] },
				include: [{ model: User, as: 'addUser' }]
			}),

			short: () => ({
				attributes: ['id', 'fName', 'lName', 'title', 'email', 'fullName', 'formalName']
			})
		}
	}
);

User.beforeCreate(async (user) => {
	if (user.password) user.password = await bcrypt.hash(user.password, 10);
});

User.beforeUpdate(async (user) => {
	if (user.changed('password') && user.password) {
		user.password = await bcrypt.hash(user.password, 10);
	}
});

export default User;
