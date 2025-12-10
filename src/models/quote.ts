import {
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	ForeignKey,
	NonAttribute,
	VIRTUAL,
	CreationAttributes,
	Op
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import { trimProperties } from '@/lib/format';
import Joi from 'joi';
import { DateTime } from 'luxon';
import User from './user';
import QuotePart from './quotePart';
import QuoteContact from './_quotesContacts';
import Opportunity from './opportunity';
import QuotePartItem from './quotePartItem';
import Currency from './currency';
import Exchange, { updateRates } from '@/lib/exchange';
import Task from './task';
import { BaseModel } from './_baseModel';

export enum Messages {
	code400 = 'Quote was already deleted',
	code400_1 = 'Duplicated Quote',
	code400_2 = 'Quote status is invalid',
	code400_10 = 'Quote needs to have parts to be changed as Done',
	code400_11 = 'Quote needs to have contacts to be changed as Done',
	code400_21 = 'Only presented quotes can be revised',
	code403 = 'User is not authorized',
	code404 = 'Quote was not found'
}

export enum Status {
	Pending = 0,
	InProgress = 10,
	Done = 20,
	Approved = 30,
	Presented = 40,
	Expired = 50,
	ClosedAsRevision = 100,
	Cancelled = 200
}

export enum DiscountType {
	None = 0,
	Percentage = 1,
	Amount = 2
}

class Quote extends BaseModel<InferAttributes<Quote>, InferCreationAttributes<Quote>> {
	declare id: CreationOptional<string>;

	declare status: CreationOptional<Status>;
	declare name: CreationOptional<string>;
	declare quoteNumber: CreationOptional<string>;
	declare quoteDate: CreationOptional<Date>;
	declare quoteExpDate: CreationOptional<Date>;
	declare quoteDelivery: CreationOptional<Date>;

	declare parIntro: CreationOptional<string>;
	declare parClosing: CreationOptional<string>;
	declare parTerms: CreationOptional<string>;

	declare subTotal: CreationOptional<number>;
	declare discount: CreationOptional<number>;
	declare taxPerc: CreationOptional<number>;
	declare taxAmount: CreationOptional<number>;
	declare total: CreationOptional<number>;

	declare optional: CreationOptional<number>;
	declare discountType: CreationOptional<DiscountType>;
	declare discountPerc: CreationOptional<number>;

	declare cost: CreationOptional<number>;
	declare profit: CreationOptional<number>;
	declare profitPerc: CreationOptional<number>;

	// Associations
	declare opportunityId: ForeignKey<string>;
	declare salesUserId: ForeignKey<string>;
	declare revisedQuoteId: CreationOptional<ForeignKey<string | null>>;
	declare currencyCode: ForeignKey<string>;

	declare opportunity?: NonAttribute<Opportunity>;
	declare salesUser?: NonAttribute<User>;
	declare revisedQuote?: NonAttribute<Quote>;
	declare currency: NonAttribute<Currency>;

	declare parts: NonAttribute<QuotePart[]>;
	declare tasks: NonAttribute<Task[]>;
	declare contacts: NonAttribute<CreationAttributes<QuoteContact>[]>;

	// Virtual fields
	declare strStatus: string;
	declare date: Date;
	declare amount: number;

	/** Calculates costs, subtotals, discounts, taxes, and profit */
	async calculation(): Promise<boolean> {
		try {
			const me = await Quote.scope('me').findByPk(this.id);

			if (!me) return false;

			await updateRates();

			me.subTotal = 0;
			me.optional = 0;
			me.cost = 0;

			for (const part of me.parts as QuotePart[]) {
				for (const item of part.items ?? []) {
					let calUnitPrice = 0;
					let unitCost = 0;

					for (const cost of item.costs ?? []) {
						const costAmount =
							Number(cost.quantity) *
							(Number(cost.costMaterial) + Number(cost.costLabor) + Number(cost.costOther));
						const price = costAmount / (1 - Number(cost.profit));

						calUnitPrice += Exchange(price, cost.currencyCode, me.currencyCode).value ?? 0;
						unitCost += Exchange(costAmount, cost.currencyCode, me.currencyCode).value ?? 0;
					}

					await QuotePartItem.update({ calUnitPrice, unitCost }, { where: { id: item.id } });

					const itemSubTotal = Number(item.quantity) * calUnitPrice;

					if (part.isOptional) me.optional += itemSubTotal;
					else {
						me.subTotal += itemSubTotal;
						me.cost += Number(item.quantity) * unitCost;
					}
				}
			}

			if (me.discountType === DiscountType.None) {
				me.discount = 0;
				me.discountPerc = 0;
			} else if (me.discountType === DiscountType.Amount) {
				me.discountPerc = me.subTotal !== 0 ? me.discount / me.subTotal : 0;
			} else if (me.discountType === DiscountType.Percentage) {
				me.discount = me.subTotal * Number(me.discountPerc);
			}

			if (me.status === Status.Pending && me.subTotal > 0) me.status = Status.InProgress;
			else if (me.status === Status.InProgress && me.subTotal <= 0.01) me.status = Status.Pending;

			await me.save();
			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	}

	/** Validates status change before applying */
	statusChangeValidator(req: Request): { err?: string } {
		const body = trimProperties(req.body);
		const schema = Joi.object({ toStatus: Joi.number().min(0).max(200).required() });
		const { error } = schema.validate(body);

		if (error) return { err: error.message };

		const toStatus = body.toStatus;
		const validStatus = [
			Status.Pending,
			Status.InProgress,
			Status.Done,
			Status.Approved,
			Status.Presented,
			Status.Expired,
			Status.ClosedAsRevision,
			Status.Cancelled
		];

		if (!validStatus.includes(toStatus)) return { err: Messages.code400_2 };

		if (toStatus === Status.Done && this.status === Status.InProgress) {
			if (this.parts.length === 0) return { err: Messages.code400_10 };

			if (this.contacts.length === 0) return { err: Messages.code400_11 };

			return {};
		}

		return { err: 'Change status is not allowed' };
	}

	/** Generates a new quote number */
	static async newQuoteNumber(): Promise<string> {
		const today = DateTime.now().setZone('UTC');
		const year = today.year.toString().substring(2);
		const week = today.weekNumber.toString().padStart(2, '0');
		const thisWeek = DateTime.now().toUTC().startOf('week');

		const res = await Quote.findAll({ where: { addDate: { [Op.gte]: thisWeek.toJSDate() } } });
		const index = String(res.length + 1).padStart(2, '0');

		return `Q${year}${week}${index}`;
	}

	/** Returns a revision quote number from a previous one */
	static getRevisionNumber(previousNumber: string) {
		const split = previousNumber.split('-R');

		if (split.length <= 1) return previousNumber + '-R1';

		const newRev = Number(split[1]) + 1;
		return split[0] + '-R' + newRev;
	}
}

Quote.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

		status: { type: DataTypes.TINYINT, defaultValue: Status.InProgress },
		name: { type: DataTypes.STRING(250) },
		quoteNumber: { type: DataTypes.STRING(30), allowNull: false },
		quoteDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		quoteExpDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		quoteDelivery: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },

		parIntro: { type: DataTypes.TEXT },
		parClosing: { type: DataTypes.TEXT },
		parTerms: { type: DataTypes.TEXT },

		subTotal: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		discount: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		taxPerc: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0.16 },
		taxAmount: {
			type: VIRTUAL,
			get() {
				const subtotal = Number(this.getDataValue('subTotal'));
				const discount = Number(this.getDataValue('discount'));
				return (subtotal - discount) * Number(this.getDataValue('taxPerc'));
			}
		},
		total: {
			type: VIRTUAL,
			get() {
				const subtotal = Number(this.getDataValue('subTotal'));
				const discount = Number(this.getDataValue('discount'));
				return (subtotal - discount) * (1 + Number(this.getDataValue('taxPerc')));
			}
		},

		optional: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		discountType: { type: DataTypes.TINYINT, defaultValue: DiscountType.None },
		discountPerc: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },

		cost: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		profit: {
			type: VIRTUAL,
			get() {
				return (
					Number(this.getDataValue('subTotal')) -
					Number(this.getDataValue('discount')) -
					Number(this.getDataValue('cost'))
				);
			}
		},
		profitPerc: {
			type: VIRTUAL,
			get() {
				const res = Number(this.getDataValue('subTotal')) -
					Number(this.getDataValue('discount')) -
					Number(this.getDataValue('cost'));
				return res === 0 ? 0 : Number(this.getDataValue('subTotal')) / res;
			}
		},

		// Audit fields
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		addUserId: { type: DataTypes.UUID, allowNull: false },
		delUserId: DataTypes.UUID,
		delDate: DataTypes.DATE,

		opportunityId: { type: DataTypes.UUID, allowNull: false },
		salesUserId: { type: DataTypes.UUID, allowNull: false },
		revisedQuoteId: { type: DataTypes.UUID },
		currencyCode: { type: DataTypes.STRING(5), allowNull: false },

		strStatus: {
			type: VIRTUAL,
			get() {
				return this.status !== undefined ? Status[this.status] : '';
			}
		},
		date: {
			type: VIRTUAL,
			get() {
				return this.quoteDate ?? '';
			}
		},
		amount: {
			type: VIRTUAL,
			get() {
				return this.total ?? '';
			}
		}
	},
	{
		sequelize,
		modelName: 'quote',
		timestamps: false
	}
);

export default Quote;
