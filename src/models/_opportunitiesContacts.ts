import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	ForeignKey,
	NonAttribute
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import id from 'uniqid';
import User from './user';

class OpportunityContact extends Model<
	InferAttributes<OpportunityContact>,
	InferCreationAttributes<OpportunityContact>
> {
	declare id: CreationOptional<string>;

	declare canDecide: CreationOptional<boolean>;
	declare toQuote: CreationOptional<boolean>;
	declare note: CreationOptional<string>;

	//  Associations
	declare opportunityId: CreationOptional<ForeignKey<string>>;
	declare contactId: ForeignKey<string>;
	declare addUser: NonAttribute<User>;
	declare delUser: NonAttribute<User>;

	//  Time Stamp
	declare addUserId: CreationOptional<ForeignKey<string>>;
	declare delUserId: CreationOptional<ForeignKey<string>>;
	declare addDate: CreationOptional<Date>;
	declare delDate: CreationOptional<Date>;
}

OpportunityContact.init(
	{
		id: { type: DataTypes.STRING(25), defaultValue: () => id(), primaryKey: true },
		canDecide: { type: DataTypes.BOOLEAN, defaultValue: true, comment: 'Is the contact a decision maker?' },
		toQuote: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: 'can the contact get the opportunity quotes?'
		},
		note: { type: DataTypes.TEXT },

		//  Timestamp
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		delDate: { type: DataTypes.DATE, allowNull: true }
	},
	{
		sequelize,
		modelName: '_opportunitiesContacts',
		freezeTableName: true,
		timestamps: false,
		defaultScope: {}
	}
);
export default OpportunityContact;
