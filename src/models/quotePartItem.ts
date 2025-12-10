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
import QuotePartItemCost, { schema as costSchema } from './quotePartItemCost';
import QuotePart from './quotePart';

// ------------------ Joi schema ------------------
export const schema = () =>
	Joi.object({
		id: Joi.string().allow('', null).max(25),
		item: Joi.string().allow('', null).max(10),
		quantity: Joi.number().min(0),
		unit: Joi.string().allow('', null).max(15),
		description: Joi.string(),
		fixed: Joi.boolean(),
		fixedPrice: Joi.number().min(0),
		costs: Joi.array().items(costSchema())
	});

// ------------------ Model ------------------
class QuotePartItem extends Model<InferAttributes<QuotePartItem>, InferCreationAttributes<QuotePartItem>> {
	declare id: CreationOptional<string>;
	declare order: CreationOptional<number>;

	declare item: string;
	declare quantity: number;
	declare unit: CreationOptional<string>;
	declare description: CreationOptional<string>;

	declare fixed: CreationOptional<boolean>;
	declare fixedPrice: CreationOptional<number>;

	declare calUnitPrice: CreationOptional<number>;
	declare unitCost: CreationOptional<number>;

	// Virtual
	declare unitPrice: CreationOptional<number>;
	declare subTotal: CreationOptional<number>;

	// Associations
	declare part: NonAttribute<QuotePart>;
	declare costs: NonAttribute<QuotePartItemCost[]>;

	declare quotePartId: CreationOptional<ForeignKey<string>>;
	declare addUser: NonAttribute<User>;
	declare addUserId: CreationOptional<ForeignKey<string>>;
	declare addDate: CreationOptional<Date>;

	// ------------------ Helpers ------------------
	static pick(items: Partial<QuotePartItem>[]) {
		return items.map((item) => {
			const pick = _.pick(item, ['id', 'item', 'quantity', 'unit', 'description', 'fixed', 'fixedPrice']);

			if (pick.id?.includes('new_')) delete pick.id;

			if (item.costs) return { ...pick, costs: QuotePartItemCost.pick(item.costs) };

			return pick;
		});
	}

	static async updating(args: {
		items: Partial<QuotePartItem>[];
		quotePartId: string;
		addUserId: string;
	}): Promise<boolean> {
		const { items, quotePartId, addUserId } = args;
		const sanitizedItems = QuotePartItem.pick(items);

		try {
			// Update or create each item
			for (let order = 1; order <= sanitizedItems.length; order++) {
				const item = sanitizedItems[order - 1];

				// if (item.id) await updateItem({ ...item, order }, item.id, addUserId);
				// else {
				// 	const { costs, ...itemWithoutCosts } = item;
				// 	await createItem({ ...itemWithoutCosts, order, quotePartId, addUserId });
				// }
			}

			// Delete removed items
			const keepIds = sanitizedItems.filter((f) => !!f.id).map((i) => i.id);
			const existingItems = await QuotePartItem.findAll({ where: { quotePartId } });
			const delIds = existingItems.filter((f) => !keepIds.includes(f.id)).map((i) => i.id);

			if (delIds.length > 0) await QuotePartItem.destroy({ where: { id: { [Op.in]: delIds } } });

			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	}
}

// ------------------ Sequelize Init ------------------
QuotePartItem.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		order: { type: DataTypes.SMALLINT },

		item: { type: DataTypes.STRING(10) },
		quantity: { type: DataTypes.FLOAT },
		unit: { type: DataTypes.STRING(15) },
		description: { type: DataTypes.TEXT },

		fixed: { type: DataTypes.BOOLEAN, defaultValue: false },
		fixedPrice: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		calUnitPrice: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		unitCost: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },

		// Virtual
		unitPrice: {
			type: DataTypes.VIRTUAL,
			get() {
				return this.getDataValue('fixed') ? this.getDataValue('fixedPrice') : this.getDataValue('calUnitPrice');
			}
		},
		subTotal: {
			type: DataTypes.VIRTUAL,
			get() {
				return (
					this.getDataValue('quantity') *
					(this.getDataValue('fixed') ? this.getDataValue('fixedPrice') : this.getDataValue('calUnitPrice'))
				);
			}
		},

		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
	},
	{
		sequelize,
		modelName: 'quotePartItem',
		timestamps: false,
		defaultScope: {
			include: [{ model: QuotePartItemCost, as: 'costs' }],
			order: [['order', 'ASC']]
		}
	}
);

// ------------------ Helpers ------------------
async function updateItem(item: Partial<QuotePartItem>, id: string, addUserId: string) {
	const { costs, ...itemWithoutCosts } = item;
	await QuotePartItem.update(itemWithoutCosts, { where: { id } });

	if (costs) await QuotePartItemCost.updating({ costs, quotePartItemId: id, addUserId });
}

async function createItem(item: Partial<QuotePartItem>) {
	const newItem: CreationAttributes<QuotePartItem> = {
		order: item.order,
		item: item.item ?? '',
		quantity: item.quantity ?? 0,
		description: item.description,
		quotePartId: item.quotePartId,
		addUserId: item.addUserId
	};
	const created = await QuotePartItem.create(newItem);

	if (item.costs)
		await QuotePartItemCost.updating({
			costs: item.costs,
			quotePartItemId: created.id,
			addUserId: created.addUserId ?? ''
		});
}

export default QuotePartItem;
