import {
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	ForeignKey,
	NonAttribute,
	DataTypes
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import Contact from './contact';
import Quote from './quote';
import Joi from 'joi';
import _ from 'lodash';
import { BaseModel } from './_baseModel';

export const schema = (isPost: boolean) => {
	return Joi.object({
		id: Joi.string().allow('', null).max(25),
		quoteId: Joi.string().allow('', null),
		contactId: isPost ? Joi.string().allow('', null).max(25).required() : Joi.string().allow('', null).max(25)
	});
};

class QuoteContact extends BaseModel<InferAttributes<QuoteContact>, InferCreationAttributes<QuoteContact>> {
	declare id: CreationOptional<string>;
	//  Associations
	declare quoteId: ForeignKey<string>;
	declare contactId: ForeignKey<string>;

	declare contact: NonAttribute<Contact>;
	declare quote: NonAttribute<Quote>;

	static pick(quoteContacts: Partial<QuoteContact>[]) {
		const res = quoteContacts.map((quoteContact) => {
			const pick = _.pick(quoteContact, ['id', 'contactId', 'quoteId']);
			return pick;
		});
		return res;
	}
}

QuoteContact.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		quoteId: { type: DataTypes.UUID, allowNull: false },
		contactId: { type: DataTypes.UUID, allowNull: false },

		// Audit fields
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		addUserId: { type: DataTypes.UUID, allowNull: false },
		delUserId: DataTypes.UUID,
		delDate: DataTypes.DATE
	},
	{
		sequelize,
		modelName: '_quotesContacts',
		freezeTableName: true,
		timestamps: false,
		defaultScope: {}
	}
);
export default QuoteContact;
