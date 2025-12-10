import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	ForeignKey,
	NonAttribute,
	DataTypes
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import id from 'uniqid';
import Contact from './contact';
import Quote from './quote';
import Joi from 'joi';
import _ from 'lodash';

export const schema = (isPost: boolean) => {
	return Joi.object({
		id: Joi.string().allow('', null).max(25),
		quoteId: Joi.string().allow('', null),
		contactId: isPost ? Joi.string().allow('', null).max(25).required() : Joi.string().allow('', null).max(25)
	});
};

class QuoteContact extends Model<InferAttributes<QuoteContact>, InferCreationAttributes<QuoteContact>> {
	declare id: CreationOptional<string>;
	//  Associations
	declare quoteId: CreationOptional<ForeignKey<string>>;
	declare contactId: ForeignKey<string>;
	declare Contact: NonAttribute<Contact>;
	declare Quote: NonAttribute<Quote>;

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
		id: { type: DataTypes.STRING(25), defaultValue: () => id(), primaryKey: true }
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
