import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	ForeignKey,
	NonAttribute,
	CreationAttributes,
	Op
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import _ from 'lodash';
import Joi from 'joi';

import User from './user';
import Currency from './currency';

// ------------------ Joi schema ------------------
export const schema = () =>
	Joi.object({
		quantity: Joi.number().min(0),
		unit: Joi.string().allow('', null).max(15),
		description: Joi.string().allow('', null),
		note: Joi.string().allow('', null),
		costMaterial: Joi.number().min(0),
		costLabor: Joi.number().min(0),
		costOther: Joi.number().min(0),
		currencyCode: Joi.string().max(5),
		profit: Joi.number().min(0).less(1),
		pending: Joi.boolean(),
		pendingFollowUpDate: Joi.date().allow(null)
	});

// ------------------ Model ------------------
class QuotePartItemCost extends Model<InferAttributes<QuotePartItemCost>, InferCreationAttributes<QuotePartItemCost>> {
	declare id: CreationOptional<string>;
	declare order: CreationOptional<number>;

	declare quantity: number;
	declare unit: CreationOptional<string>;
	declare description: CreationOptional<string>;
	declare note: CreationOptional<string>;
	declare costMaterial: CreationOptional<number>;
	declare costLabor: CreationOptional<number>;
	declare costOther: CreationOptional<number>;
	declare profit: CreationOptional<number>;
	declare subTotal: NonAttribute<number>;
	declare pending: CreationOptional<boolean>;
	declare pendingFollowUpDate: CreationOptional<boolean>;

	// Associations
	declare quotePartItemId: CreationOptional<ForeignKey<string>>;
	declare productId: CreationOptional<ForeignKey<string>>;
	declare currency: NonAttribute<Currency>;
	declare currencyCode: ForeignKey<string>;
	declare addUser: NonAttribute<User>;

	// Time Stamp
	declare addUserId: CreationOptional<ForeignKey<string>>;
	declare addDate: CreationOptional<Date>;

	// ------------------ Helpers ------------------
	static pick(costs: Partial<QuotePartItemCost>[]) {
		return costs.map((cost) =>
			_.pick(cost, [
				'item',
				'quantity',
				'unit',
				'description',
				'note',
				'costMaterial',
				'costLabor',
				'costOther',
				'currencyCode',
				'profit',
				'pending',
				'pendingFollowUpDate'
			])
		);
	}

	static async updating(args: {
		costs: Partial<QuotePartItemCost>[];
		quotePartItemId: string;
		addUserId: string;
	}): Promise<boolean> {
		const { costs, quotePartItemId, addUserId } = args;
		const sanitizedCosts = QuotePartItemCost.pick(costs);

		try {
			for (let order = 1; order <= sanitizedCosts.length; order++) {
				const cost = sanitizedCosts[order - 1];

				if (cost.id) await updateCost({ ...cost, order }, cost.id, addUserId);
				else await createCost({ ...cost, order, quotePartItemId, addUserId });
			}

			// Delete removed costs
			const keepIds = sanitizedCosts.filter((c) => !!c.id).map((c) => c.id);
			const existingCosts = await QuotePartItemCost.findAll({ where: { quotePartItemId } });
			const delIds = existingCosts.filter((c) => !keepIds.includes(c.id)).map((c) => c.id);

			if (delIds.length > 0) await QuotePartItemCost.destroy({ where: { id: { [Op.in]: delIds } } });

			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	}
}

// ------------------ Sequelize Init ------------------
QuotePartItemCost.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		order: { type: DataTypes.SMALLINT },

		quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
		unit: { type: DataTypes.STRING(15) },
		description: { type: DataTypes.TEXT },
		note: { type: DataTypes.TEXT },
		costMaterial: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		costLabor: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		costOther: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		profit: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		pending: { type: DataTypes.BOOLEAN, defaultValue: false },
		pendingFollowUpDate: { type: DataTypes.DATE },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
	},
	{
		sequelize,
		modelName: 'quotePartItemCost',
		timestamps: false,
		defaultScope: { order: [['order', 'ASC']] }
	}
);

// ------------------ Helpers ------------------
async function updateCost(cost: Partial<QuotePartItemCost>, id: string, addUserId: string) {
	await QuotePartItemCost.update(cost, { where: { id } });
}

async function createCost(cost: Partial<QuotePartItemCost>) {
	const newCost: CreationAttributes<QuotePartItemCost> = {
		order: cost.order,
		quantity: cost.quantity ?? 0,
		unit: cost.unit,
		description: cost.description,
		note: cost.note,
		costMaterial: cost.costMaterial,
		costLabor: cost.costLabor,
		costOther: cost.costOther,
		currencyCode: cost.currencyCode ?? '',
		profit: cost.profit,
		pending: cost.pending,
		pendingFollowUpDate: cost.pendingFollowUpDate,
		quotePartItemId: cost.quotePartItemId,
		addUserId: cost.addUserId
	};
	await QuotePartItemCost.create(newCost);
}

export default QuotePartItemCost;
