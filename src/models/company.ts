import _ from 'lodash';
import {
	Op,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	ForeignKey,
	NonAttribute
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import { trimProperties } from '@/lib/format';
import Joi from 'joi';
import id from 'uniqid';
import User from './user';
import Contact from './contact';
import Opportunity from './opportunity';
import Quote from './quote';

export enum messages {
	code400 = 'Company has already deleted',
	code400_1 = 'Company has active contacts',
	code403 = 'User is not authorized',
	code404 = 'Company was not found'
}

class Company extends Model<InferAttributes<Company>, InferCreationAttributes<Company>> {
	declare id: CreationOptional<string>;
	declare active: CreationOptional<boolean>;

	declare name: string;
	declare city: string;
	declare state: string;
	declare region: string;

	declare street1: CreationOptional<string>;
	declare street2: CreationOptional<string>;
	declare zipCode: CreationOptional<string>;

	declare taxId: CreationOptional<string>;
	declare phone: CreationOptional<string>;
	declare phone2: CreationOptional<string>;

	declare isClient: CreationOptional<boolean>;
	declare isPartner: CreationOptional<boolean>;
	declare isSupplier: CreationOptional<boolean>;
	declare isCompetitor: CreationOptional<boolean>;

	//  Associations
	declare salesUserId: CreationOptional<ForeignKey<string> | null>;
	declare salesUser: NonAttribute<User>;
	declare contacts: NonAttribute<Contact[]>;

	//  Time Stamp
	declare addUserId: CreationOptional<ForeignKey<string>>;
	declare delUserId: CreationOptional<ForeignKey<string>>;
	declare addDate: CreationOptional<Date>;
	declare delDate: CreationOptional<Date>;

	static async dataValidation(args: {
		user: User;
		body: Partial<Company>;
		method: 'POST' | 'PUT';
		putModel?: Company;
	}): Promise<{ model?: Company; message?: string; status?: number }> {
		const { user, method, putModel, ...req } = args;

		const isPost = method === 'POST';
		//  Validation
		let body = trimProperties(req.body);
		body = _.omit(body, [
			'id',
			'active',
			'addUserId',
			'delUserId',
			'addDate',
			'delDate',
			'salesUser',
			'addUser',
			'contacts',
			'opportunities',
			'quotes',
			'projects'
		]);

		const schema = Joi.object({
			//  Not NULL
			name: isPost ? Joi.string().min(1).max(255).required() : Joi.string().min(1).max(255),
			city: isPost
				? Joi.string().allow('', null).min(1).max(75).required()
				: Joi.string().allow('', null).min(1).max(75),
			state: isPost
				? Joi.string().allow('', null).min(1).max(75).required()
				: Joi.string().allow('', null).min(1).max(75),
			region: isPost
				? Joi.string().allow('', null).min(1).max(75).required()
				: Joi.string().allow('', null).min(1).max(75),
			street1: Joi.string().allow('', null).max(150),
			street2: Joi.string().allow('', null).max(150),
			zipCode: Joi.string().allow('', null).max(25),
			taxId: Joi.string().allow('', null).min(2).max(30),
			phone: Joi.string().allow('', null).min(7).max(25),
			phone2: Joi.string().allow('', null).min(7).max(25),

			isClient: Joi.boolean(),
			isPartner: Joi.boolean(),
			isSupplier: Joi.boolean(),
			isCompetitor: Joi.boolean(),

			salesUserId: Joi.string().allow('', null).max(25)
		});
		//  Validate Body Request
		const { error } = schema.validate(body);

		if (error) return { message: error.message };

		//  *** Business Logic ***
		const action = isPost ? 'add' : 'update';
		const model = putModel ?? Company.build(body);

		if (putModel) model.set(body);

		if (!model.isClient && !model.isPartner && !model.isSupplier && !model.isCompetitor)
			return { message: 'At least one company type is required' };

		if (
			action === 'update' &&
			!user.isRoleSystem &&
			!user.isRoleAdmin &&
			!user.authCompanyMod &&
			model.addUserId !== user.id &&
			model.salesUserId !== user.id
		)
			return { message: 'Not authorized to ' + action + ' company', status: 403 };

		if (model.isClient && !model.salesUserId) {
			if (!user.isRoleSales) return { message: '"salesUserId" is required' };
			else model.salesUserId = user.id;
		}

		if (model.isClient && body.salesUserId) {
			const checkSales = await User.findByPk(model.salesUserId ?? '');

			if (!checkSales || !checkSales.isRoleSales) return { message: '"salesUserId" is not a sales user' };
		}

		//  check for dups
		const opt: any = { where: { active: true, name: body.name ?? model.name, city: body.city ?? model.city } };

		if (!isPost) opt.where.id = { [Op.ne]: model.id };

		const dup = await Company.findOne(opt);

		if (dup) return { message: 'Duplicated company' };

		return { model };
	}
}

Company.init(
	{
		id: { type: DataTypes.STRING(25), defaultValue: () => id(), primaryKey: true },
		active: { type: DataTypes.BOOLEAN, defaultValue: true },

		name: { type: DataTypes.STRING(255), allowNull: false, validate: { min: 1, max: 255 } },
		city: { type: DataTypes.STRING(75), allowNull: false, validate: { min: 1, max: 75 } },
		state: { type: DataTypes.STRING(75), allowNull: false, validate: { min: 1, max: 75 } },
		region: { type: DataTypes.STRING(75), allowNull: false, validate: { min: 1, max: 75 } },

		street1: { type: DataTypes.STRING(150) },
		street2: { type: DataTypes.STRING(150) },
		zipCode: { type: DataTypes.STRING(25) },

		taxId: { type: DataTypes.STRING(20) },
		phone: { type: DataTypes.STRING(25) },
		phone2: { type: DataTypes.STRING(25) },

		isClient: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '' },
		isPartner: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '' },
		isSupplier: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '' },
		isCompetitor: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '' },

		//  Timestamp
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		delDate: { type: DataTypes.DATE, allowNull: true }
	},
	{
		sequelize,
		modelName: 'company',
		timestamps: false,
		defaultScope: {
			attributes: { exclude: ['addDate', 'delDate'] }
		},
		scopes: {
			read: () => {
				return {
					include: [
						{ model: User, as: 'addUser' },
						{ model: User, as: 'salesUser' }
					],
					order: [
						['name', 'ASC'],
						['city', 'ASC']
					]
				};
			},
			me: () => {
				return {
					include: [
						{ model: User, as: 'addUser' },
						{ model: User, as: 'salesUser' },
						{ model: Contact, as: 'contacts', where: { active: true }, required: false },
						{
							model: Opportunity,
							as: 'opportunities',
							where: { active: true },
							required: false,
							include: [{ model: Quote, as: 'quotes', where: { active: true }, required: false }]
						}
					],
					order: [
						['contacts', 'lName', 'ASC'],
						['contacts', 'fName', 'ASC']
					]
				};
			},
			short: () => {
				return {
					attributes: ['id', 'name', 'city', 'state', 'region']
				};
			}
		}
	}
);
export default Company;
export type CompanyType = Partial<Company>;
