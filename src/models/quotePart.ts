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
import QuotePartItem, { schema as itemSchema } from './quotePartItem';
import OpportunityPart from './opportunityPart';
import Quote from './quote';

// ------------------ Joi schema ------------------
export const schema = () =>
	Joi.object({
		id: Joi.string().allow('', null).max(25),
		name: Joi.string().min(1).max(250),
		description: Joi.string().allow('', null),
		isOptional: Joi.boolean(),
		items: Joi.array().items(itemSchema())
	});

// ------------------ Model ------------------
class QuotePart extends Model<InferAttributes<QuotePart>, InferCreationAttributes<QuotePart>> {
	declare id: CreationOptional<string>;
	declare order: CreationOptional<number>;
	declare name: string;
	declare description: CreationOptional<string>;
	declare quoted: CreationOptional<boolean>;
	declare isOptional: CreationOptional<boolean>;
	declare amount: CreationOptional<NonAttribute<number>>;

	// Associations
	declare quote: NonAttribute<Quote>;
	declare items: NonAttribute<QuotePartItem[]>;

	declare quoteId: CreationOptional<ForeignKey<string>>;
	declare opportunityPartId: CreationOptional<ForeignKey<string>>;
	declare addUser: NonAttribute<User>;
	declare addUserId: CreationOptional<ForeignKey<string>>;
	declare addDate: CreationOptional<Date>;

	// ------------------ Helpers ------------------

	static pick(parts: Partial<QuotePart>[]) {
		return parts.map((part) => {
			const pick = _.pick(part, ['id', 'name', 'description', 'isOptional']);

			if (pick.id?.startsWith('new_')) delete pick.id;

			if (part.items) return { ...pick, items: QuotePartItem.pick(part.items) };

			return pick;
		});
	}

	static async updating(args: {
		parts: CreationAttributes<QuotePart>[];
		quoteId: string;
		addUserId: string;
	}): Promise<boolean> {
		const { parts, quoteId, addUserId } = args;
		const sanitizedParts = QuotePart.pick(parts) as QuotePart[];

		try {
			// Create or update each part
			for (let order = 1; order <= sanitizedParts.length; order++) {
				const part = sanitizedParts[order - 1];

				if (part.id) await updatePart(part, order, addUserId);
				else await createPart({ ...part, order, quoteId, addUserId });
			}

			// Delete removed parts
			const delIds = sanitizedParts.filter((f) => !!f.id).map((i) => i.id);
			const existingParts = await QuotePart.findAll({ where: { quoteId } });

			const delPartIds = existingParts.filter((f) => !delIds.includes(f.id)).map((i) => i.id);

			if (delPartIds.length > 0) await QuotePart.destroy({ where: { id: { [Op.in]: delPartIds } } });

			// Reset quoted flag for opportunity parts if deleted
			const updateOppPartIds = existingParts
				.filter((f) => !delIds.includes(f.id) && f.opportunityPartId)
				.map((i) => i.opportunityPartId);

			if (updateOppPartIds.length > 0)
				await OpportunityPart.update({ quoted: false }, { where: { id: { [Op.in]: updateOppPartIds } } });

			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	}
}

// ------------------ Sequelize Init ------------------
QuotePart.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		order: { type: DataTypes.SMALLINT },
		name: { type: DataTypes.STRING(250), allowNull: false },
		description: { type: DataTypes.TEXT },
		quoted: { type: DataTypes.BOOLEAN, defaultValue: false },
		isOptional: { type: DataTypes.BOOLEAN, defaultValue: false },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
	},
	{
		sequelize,
		modelName: 'quotePart',
		timestamps: false,
		defaultScope: {
			include: [{ model: QuotePartItem, as: 'items' }],
			order: [['order', 'ASC']]
		}
	}
);

// ------------------ Helpers ------------------
async function updatePart(part: Partial<QuotePart>, order: number, addUserId: string) {
	await QuotePart.update({ ...part, order }, { where: { id: part.id } });

	if (part.items) await QuotePartItem.updating({ items: part.items, quotePartId: part.id!, addUserId });
}

async function createPart(part: Partial<QuotePart>) {
	const newPart: CreationAttributes<QuotePart> = {
		order: part.order,
		name: part.name ?? '',
		description: part.description,
		quoted: part.quoted,
		quoteId: part.quoteId,
		opportunityPartId: part.opportunityPartId,
		addUserId: part.addUserId
	};
	const createdPart = await QuotePart.create(newPart);

	if (part.items)
		await QuotePartItem.updating({
			items: part.items,
			quotePartId: createdPart.id,
			addUserId: createdPart.addUserId
		});
}

export default QuotePart;
