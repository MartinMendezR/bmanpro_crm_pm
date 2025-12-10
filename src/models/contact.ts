import _ from 'lodash';
import {
	Op,
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
import Company from './company';
import User from './user';
import Opportunity from './opportunity';
import { BaseModel } from './_baseModel';

export enum messages {
	code400 = 'Contact was already deleted',
	code400_1 = 'Duplicated Contact',
	code403 = 'User is not authorized',
	code404 = 'Contact was not found'
}

class Contact extends BaseModel<InferAttributes<Contact>, InferCreationAttributes<Contact>> {
	// Auto-generated / optional
	declare id: CreationOptional<string>;
	declare avatar: CreationOptional<string>;

	// Required fields
	declare fName: string;
	declare lName: string;

	// Optional fields
	declare prefix?: string;
	declare salutation?: string;
	declare title?: string;
	declare department?: string;
	declare phone?: string;
	declare phonePersonal?: string;
	declare email?: string;
	declare emailPersonal?: string;

	// Associations (NonAttribute)
	declare companyId: ForeignKey<string>;
	declare addUserId: ForeignKey<string>;
	declare delUserId: ForeignKey<string>;
	declare company?: NonAttribute<Company>;

	// Virtual fields
	declare fullName: CreationOptional<string>;
	declare name: CreationOptional<string>;

	//  Data Validation Method
	static async dataValidation(args: {
		method: 'POST' | 'PUT';
		user: User;
		contact: Partial<Contact>;
		putModel?: Contact;
	}): Promise<{ model?: Contact; message?: string; status?: number }> {
		const { contact, method, user, putModel } = args;
		const isPost = method === 'POST';

		//  Trim and sanitize input
		let body = trimProperties(contact);
		body = _.omit(body, [
			'id',
			'active',
			'addUserId',
			'delUserId',
			'addDate',
			'delDate',
			'addUser',
			'company',
			'fullName',
			'name',
			'opportunities'
		]);

		//  Joi validation
		const schema = Joi.object({
			avatar: Joi.string().allow('', null),
			access: Joi.boolean(),

			prefix: Joi.string().allow('', null).max(25),
			fName: isPost ? Joi.string().min(1).max(100).required() : Joi.string().min(1).max(100),
			lName: isPost ? Joi.string().min(1).max(100).required() : Joi.string().min(1).max(100),
			salutation: Joi.string().allow('', null).max(100),
			title: Joi.string().allow('', null).max(100),
			department: Joi.string().allow('', null).max(150),

			phone: Joi.string().allow('', null).min(7).max(25),
			phonePersonal: Joi.string().allow('', null).min(7).max(25),
			email: Joi.string().allow('', null).min(7).max(150).email(),
			emailPersonal: Joi.string().allow('', null).min(7).max(150).email(),

			companyId: isPost ? Joi.string().allow('', null).max(25).required() : Joi.string().allow('', null).max(25)
		});
		const { error } = schema.validate(body);

		if (error) return { message: error.message };

		//  Business Logic
		const model = putModel ?? Contact.build(body);

		if (putModel) model.set(body);

		if (isPost) {
			const company = await Company.findByPk(model.companyId ?? '');

			if (!company) return { message: '"companyId" is invalid' };
		} else {
			if (!user.isRoleSystem && !user.isRoleAdmin && !user.authContactMod && model.addUserId !== user.id)
				return { message: messages.code403, status: 403 };
		}

		const opt: any = {
			where: {
				active: true,
				companyId: model.companyId,
				fName: body.fName ?? model.fName,
				lName: body.lName ?? model.lName
			}
		};

		if (!isPost) opt.where.id = { [Op.ne]: model.id };

		try {
			const dup = await Contact.findOne(opt);

			if (dup) return { message: messages.code400_1 };

			return { model };
		} catch (error) {
			console.log(error);
			return { message: 'server error' };
		}
	}
}

Contact.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		avatar: { type: DataTypes.TEXT },

		prefix: { type: DataTypes.STRING(25) },
		fName: { type: DataTypes.STRING(100), allowNull: false, validate: { min: 1, max: 100 } },
		lName: { type: DataTypes.STRING(100), allowNull: false, validate: { min: 1, max: 100 } },
		salutation: { type: DataTypes.STRING(100), validate: { min: 1, max: 200 } },
		title: { type: DataTypes.STRING(100) },
		department: { type: DataTypes.STRING(150) },

		phone: { type: DataTypes.STRING(25) },
		phonePersonal: { type: DataTypes.STRING(25) },
		email: { type: DataTypes.STRING(150) },
		emailPersonal: { type: DataTypes.STRING(150) },

		// Audit fields
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		addUserId: { type: DataTypes.UUID, allowNull: false },
		delUserId: DataTypes.UUID,
		delDate: DataTypes.DATE,		

		//	Associations
		companyId: { type: DataTypes.UUID, allowNull: false },

		// Virtuals
		fullName: {
			type: DataTypes.VIRTUAL,
			get() {
				return this.getDataValue('fName') + ' ' + this.getDataValue('lName');
			}
		},
		name: {
			type: DataTypes.VIRTUAL,
			get() {
				return this.getDataValue('lName') + ', ' + this.getDataValue('fName');
			}
		}
	},
	{
		sequelize,
		modelName: 'contact',
		timestamps: false,
		defaultScope: {},
		scopes: {
			read: () => ({
				include: [{ model: Company, as: 'company' }],
				attributes: [
					'id',
					'active',
					'name',
					'fullName',
					'prefix',
					'fName',
					'lName',
					'title',
					'department',
					'companyId',
					'addUserId'
				],
				order: [
					['lName', 'ASC'],
					['fName', 'ASC']
				]
			}),
			me: () => ({
				include: [
					{ model: Company, as: 'company' },
					{ model: Opportunity, as: 'opportunities' },
					{ model: User, as: 'addUser' }
				]
			}),
			short: () => ({
				attributes: ['id', 'active', 'fName', 'lName', 'email']
			})
		}
	}
);

export default Contact;
