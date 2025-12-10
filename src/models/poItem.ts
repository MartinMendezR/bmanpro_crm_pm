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
import User from './user';
import Joi from 'joi';
import _ from 'lodash';
import QuotePartItem from './quotePartItem';

// ---------------- Schema ----------------
export const schema = () =>
	Joi.object({
		id: Joi.string().allow('', null).max(25),
		item: Joi.string().allow('', null).max(10),
		quantity: Joi.number().min(0),
		unit: Joi.string().allow('', null).max(15),
		description: Joi.string().allow('', null),
		unitPrice: Joi.number().min(0),
		unitCost: Joi.number().min(0),
		quotePartItemId: Joi.string().allow('', null).max(25)
	});

class POItem extends Model<InferAttributes<POItem>, InferCreationAttributes<POItem>> {
	declare id: CreationOptional<string>;
	declare order: CreationOptional<number>;

	declare item: string;
	declare quantity: number;
	declare unit: CreationOptional<string>;
	declare description: CreationOptional<string>;

	declare unitPrice: CreationOptional<number>;
	declare unitCost: CreationOptional<number>;

	// Virtual
	declare subTotal: CreationOptional<number>;

	// Associations
	declare poId: ForeignKey<string>;
	declare addUser: NonAttribute<User>;
	declare quotePartItemId?: CreationOptional<ForeignKey<string>>;
	declare quotePartItem: NonAttribute<QuotePartItem | null>;

	// Timestamp
	declare addUserId: CreationOptional<ForeignKey<string>>;
	declare addDate: CreationOptional<Date>;

	// ---------------- Pick fields ----------------
	static pick(items: Partial<POItem>[]) {
		return items.map((item) => {
			const picked = _.pick(item, [
				'id',
				'item',
				'quantity',
				'unit',
				'description',
				'unitPrice',
				'quotePartItemId'
			]);

			if (picked.id?.includes('new_')) delete picked.id;

			if (picked.quotePartItemId === '') delete picked.quotePartItemId;

			return picked;
		});
	}

	// ---------------- Updating ----------------
	static async updating(args: {
		items: CreationAttributes<POItem>[];
		poId: string;
		addUserId: string;
	}): Promise<boolean> {
		const { items, poId, addUserId } = args;

		try {
			const sanitizedItems = POItem.pick(items) as POItem[];

			// Update or create items
			const promises: Promise<any>[] = sanitizedItems.map((item, index) =>
				item.id
					? POItem.update({ ...item, order: index + 1 }, { where: { id: item.id } })
					: create({ ...item, order: index + 1, poId, addUserId })
			);

			// Delete removed items
			const delIds = sanitizedItems.filter((i) => !!i.id).map((i) => i.id);
			const existingItems = await POItem.findAll({ where: { poId } });
			const delPartIds = existingItems.filter((i) => !delIds.includes(i.id)).map((i) => i.id);

			if (delPartIds.length) promises.push(POItem.destroy({ where: { id: { [Op.in]: delPartIds } } }));

			await Promise.all(promises);

			// Trigger opportunity logic
			const quotePartItemIds = items
				.map((i) => i.quotePartItemId)
				.filter((id): id is string => typeof id === 'string' && !!id);

			if (quotePartItemIds.length) {
				// await Opportunity.wonByQuotePartItems(quotePartItemIds);
			}

			return true;
		} catch (err) {
			console.error(err);
			throw err;
		}
	}
}

// ---------------- Init Model ----------------
POItem.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		order: { type: DataTypes.SMALLINT },

		item: { type: DataTypes.STRING(10) },
		quantity: { type: DataTypes.FLOAT },
		unit: { type: DataTypes.STRING(15) },
		description: { type: DataTypes.TEXT },

		unitPrice: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0, comment: 'Calculated unit price' },
		unitCost: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0, comment: 'Unit cost per item' },

		// Virtual
		subTotal: {
			type: DataTypes.VIRTUAL,
			get() {
				return Number(this.getDataValue('quantity') || 0) * Number(this.getDataValue('unitPrice') || 0);
			}
		},

		// Timestamp
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
	},
	{
		sequelize,
		modelName: 'poItem',
		timestamps: false,
		defaultScope: { order: [['order', 'ASC']] }
	}
);

// ---------------- Create helper ----------------
const create = async (item: Partial<POItem>) => {
	let quantity = item.quantity ?? 0;
	let description = item.description ?? '';
	let unit = item.unit ?? '';
	let unitPrice = item.unitPrice ?? 0;
	let unitCost = item.unitCost ?? 0;

	// Load values from QuotePartItem if provided
	if (item.quotePartItemId) {
		const quotePartItem = await QuotePartItem.findOne({ where: { id: item.quotePartItemId } });

		if (quotePartItem) {
			if (quantity === 0) quantity = quotePartItem.quantity;

			if (!description) description = quotePartItem.description;

			if (!unit) unit = quotePartItem.unit;

			if (unitPrice === 0) unitPrice = quotePartItem.unitPrice;

			if (unitCost === 0) unitCost = quotePartItem.unitCost;
		}
	}

	await POItem.create({
		order: item.order,
		item: item.item ?? '',
		unit,
		quantity,
		description,
		unitPrice,
		unitCost,
		poId: item.poId ?? '',
		addUserId: item.addUserId,
		quotePartItemId: item.quotePartItemId
	});
};

export default POItem;
