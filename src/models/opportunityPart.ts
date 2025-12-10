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
import User from './user';
import Opportunity from './opportunity';

class OpportunityPart extends Model<InferAttributes<OpportunityPart>, InferCreationAttributes<OpportunityPart>> {
	declare id: CreationOptional<string>;
	declare order: CreationOptional<number>;

	declare name: string;
	declare description: CreationOptional<string>;
	declare quoted: CreationOptional<boolean>;

	// Associations
	declare opportunityId: ForeignKey<string>;
	declare opportunity: NonAttribute<Opportunity>;
	declare addUserId: CreationOptional<ForeignKey<string>>;
	declare addUser: NonAttribute<User>;
	declare delUserId: CreationOptional<ForeignKey<string>>;
	declare delUser: NonAttribute<User>;

	// Timestamps
	declare addDate: CreationOptional<Date>;
	declare delDate: CreationOptional<Date>;
	declare fullName: CreationOptional<string>;
}

OpportunityPart.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		order: { type: DataTypes.SMALLINT },

		name: { type: DataTypes.STRING(250), allowNull: false },
		description: { type: DataTypes.TEXT },
		quoted: { type: DataTypes.BOOLEAN, defaultValue: false },

		// Associations
		opportunityId: { type: DataTypes.STRING(25), allowNull: false },
		addUserId: { type: DataTypes.STRING(25), allowNull: true },
		delUserId: { type: DataTypes.STRING(25), allowNull: true },

		// Timestamps
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		delDate: { type: DataTypes.DATE, allowNull: true },
		fullName: {
			type: DataTypes.VIRTUAL,
			get() {
				const order = this.getDataValue('order') ?? '';
				const name = this.getDataValue('name') ?? '';
				return [order, name].filter(Boolean).join(' ');
			}
		}
	},
	{
		sequelize,
		modelName: 'opportunityPart',
		timestamps: false,
		defaultScope: {
			attributes: ['id', 'order', 'name', 'quoted']
		},
		scopes: {
			short: { attributes: ['id', 'order', 'name', 'quoted'] },
			full: {
				include: [
					{ model: User, as: 'addUser' },
					{ model: User, as: 'delUser' }
				]
			}
		}
	}
);

export default OpportunityPart;
