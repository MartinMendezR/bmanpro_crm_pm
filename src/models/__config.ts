import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	NonAttribute,
	DataTypes,
	ForeignKey
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import Joi from 'joi';
import { trimProperties } from '@/lib/format';

export enum messages {
	code403 = 'User is not authorized',
	code404 = 'Config was not found'
}

class Config extends Model<InferAttributes<Config>, InferCreationAttributes<Config>> {
	declare id: CreationOptional<string>;
	declare businessName: string;
	declare domain: string;

	declare street1: CreationOptional<string>;
	declare street2: CreationOptional<string>;
	declare city: CreationOptional<string>;
	declare state: CreationOptional<string>;
	declare zipCode: CreationOptional<string>;

	declare addUserId: ForeignKey<string>;
	declare addDate: CreationOptional<Date>;

	//  non reply email configuration
	declare noReplyHost: CreationOptional<string>;
	declare noReplyFrom: CreationOptional<string>;
	declare noReplyPort: CreationOptional<number>;
	declare noReplyAuthUser: CreationOptional<string>;
	declare noReplyAuthPassword: CreationOptional<string>;

	static dataValidation(args: {
		method: 'POST' | 'PUT';
		body: any;
		putModel?: Config;
	}): NonAttribute<{ model?: Config; message?: string }> {
		const { method, body, putModel } = args;
		const isPost = method === 'POST';
		//  Validation
		const trimBody = trimProperties(body);

		const schema = Joi.object({
			businessName: Joi.string().min(4).max(255),
			domain: Joi.string().min(4).max(255),
			street1: Joi.string().allow('', null).max(150),
			street2: Joi.string().allow('', null).max(150),
			city: Joi.string().allow('', null).max(75),
			state: Joi.string().allow('', null).max(75),
			zipCode: Joi.string().allow('', null).max(75),

			noReplyHost: Joi.string().allow('', null).max(255),
			noReplyFrom: Joi.string().allow('', null).max(255),
			noReplyPort: Joi.number().min(0).max(255).allow('', null),
			noReplyAuthUser: Joi.string().allow('', null).max(255),
			noReplyAuthPassword: Joi.string().allow('', null).max(255)
		});

		const { error } = schema.validate(trimBody);

		if (error) return { message: error.message };

		const model = putModel ?? Config.build(trimBody);

		if (putModel) model.set(trimBody);

		return { model: putModel };
	}
}

Config.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		businessName: { type: DataTypes.STRING(255), allowNull: false },
		domain: { type: DataTypes.STRING(255), allowNull: false },
		street1: { type: DataTypes.STRING(150) },
		street2: { type: DataTypes.STRING(150) },
		city: { type: DataTypes.STRING(75) },
		state: { type: DataTypes.STRING(75) },
		zipCode: { type: DataTypes.STRING(25) },

		noReplyHost: { type: DataTypes.STRING(255) },
		noReplyFrom: { type: DataTypes.STRING(255) },
		noReplyPort: { type: DataTypes.SMALLINT, defaultValue: 465 },
		noReplyAuthUser: { type: DataTypes.STRING(255) },
		noReplyAuthPassword: { type: DataTypes.STRING(255) },

		//  Timestamp
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		addUserId: { type: DataTypes.UUID, allowNull: false }
	},
	{
		sequelize,
		modelName: '__config',
		freezeTableName: true, // this will be only one, so no need to pluralize
		timestamps: false
	}
);

export default Config;
