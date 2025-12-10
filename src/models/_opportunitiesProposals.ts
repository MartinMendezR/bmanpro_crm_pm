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
import User from './user';
import Quote from './quote';

class OpportunityProposal extends Model<
	InferAttributes<OpportunityProposal>,
	InferCreationAttributes<OpportunityProposal>
> {
	declare id: CreationOptional<string>;
	//  Associations
	declare opportunityId: CreationOptional<ForeignKey<string>>;
	declare proposalId: ForeignKey<string>;
	declare Proposal: NonAttribute<User>;
	declare Quote: NonAttribute<Quote>;
}

OpportunityProposal.init(
	{
		id: { type: DataTypes.STRING(25), defaultValue: () => id(), primaryKey: true }
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
