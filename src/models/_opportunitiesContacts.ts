import {
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	ForeignKey,
	NonAttribute
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import Opportunity from './opportunity';
import Contact from './contact';
import { BaseModel } from './_baseModel';

class OpportunityContact extends BaseModel<
	InferAttributes<OpportunityContact>,
	InferCreationAttributes<OpportunityContact>
> {
	declare id: CreationOptional<string>;

	declare canDecide: CreationOptional<boolean>;
	declare toQuote: CreationOptional<boolean>;
	declare note: CreationOptional<string>;

	//  Associations
	declare opportunityId: ForeignKey<string>;
	declare contactId: ForeignKey<string>;

	declare opportunity?: NonAttribute<Opportunity>;
	declare contact?: NonAttribute<Contact>;
}

OpportunityContact.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		canDecide: { type: DataTypes.BOOLEAN, defaultValue: true, comment: 'Is the contact a decision maker?' },
		toQuote: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: 'can the contact get the opportunity quotes?'
		},
		note: { type: DataTypes.TEXT },

		// Audit fields
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		addUserId: { type: DataTypes.UUID, allowNull: false },
		delUserId: DataTypes.UUID,
		delDate: DataTypes.DATE,

		//  Associations
		opportunityId: { type: DataTypes.UUID, allowNull: false },
		contactId: { type: DataTypes.UUID, allowNull: false },
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
