import {
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	ForeignKey,
	NonAttribute,
	DataTypes
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import User from './user';
import Opportunity from './opportunity';
import { BaseModel } from './_baseModel';

class OpportunityProposal extends BaseModel<
	InferAttributes<OpportunityProposal>,
	InferCreationAttributes<OpportunityProposal>
> {
	declare id: CreationOptional<string>;
	//  Associations
	declare opportunityId: ForeignKey<string>;
	declare proposalUserId: ForeignKey<string>;

	declare opportunity: NonAttribute<Opportunity>;
	declare proposalUser: NonAttribute<User>;
}

OpportunityProposal.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

		// Audit fields
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		addUserId: { type: DataTypes.UUID, allowNull: false },
		delUserId: DataTypes.UUID,
		delDate: DataTypes.DATE,

		opportunityId: { type: DataTypes.UUID, allowNull: false },
		proposalUserId: { type: DataTypes.UUID, allowNull: false }
	},
	{
		sequelize,
		modelName: '_opportunitiesProposals',
		freezeTableName: true,
		timestamps: false,
		defaultScope: {}
	}
);
export default OpportunityProposal;
