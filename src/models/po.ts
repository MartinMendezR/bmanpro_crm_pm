import _ from 'lodash';
import {
	Op,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	ForeignKey,
	NonAttribute,
	VIRTUAL,
	CreationAttributes
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import { trimProperties } from '@/lib/format';
import Joi from 'joi';
import Company from './company';
import User from './user';
import QuoteContact from './_quotesContacts';
import Contact from './contact';
import Currency from './currency';
import { updateRates } from '@/lib/exchange';
import POItem, { schema as poItemSchema } from './poItem';

export enum Messages {
	code400 = 'PO was already deleted',
	code400_1 = 'Duplicated PO',
	code400_2 = 'PO status is invalid',
	code400_10 = 'PO needs to have parts to be changed as Done',
	code400_11 = 'PO needs to have contacts to be changed as Done',
	code400_21 = 'Only presented quotes can be revised',
	code403 = 'User is not authorized',
	code404 = 'PO was not found'
}

export enum Status {
	Received = 10,
	OnRevision = 20,
	Accepted = 50,
	Acknowledged = 100,
	InProgress = 110,
	Completed = 200,
	Rejected = 250,
	Cancelled = 251
}

export enum DiscountType {
	None = 0,
	Percentage = 1,
	Amount = 2
}

class PO extends Model<InferAttributes<PO>, InferCreationAttributes<PO>> {
	declare id: CreationOptional<string>;
	declare active: CreationOptional<boolean>;

	declare companyId: ForeignKey<string>;
	declare company: NonAttribute<Company>;
	declare buyerId: ForeignKey<string>;
	declare buyer: NonAttribute<QuoteContact>;

	declare status: CreationOptional<Status>;
	declare poNumber: string;
	declare poDate: Date;
	declare deliveryDate: Date;

	// Amounts
	declare subTotal: CreationOptional<number>;
	declare discount: CreationOptional<number>;
	declare taxPerc: CreationOptional<number>;
	declare taxAmount: CreationOptional<number>;
	declare total: CreationOptional<number>;

	declare discountType: CreationOptional<DiscountType>;
	declare discountPerc: CreationOptional<number>;

	declare cost: CreationOptional<number>;
	declare profit: CreationOptional<number>;
	declare profitPerc: CreationOptional<number>;

	// Associations
	declare currencyCode: ForeignKey<string>;
	declare currency: NonAttribute<Currency>;
	declare items: NonAttribute<POItem[]>;

	declare salesUserId: ForeignKey<string>;
	declare salesUser: NonAttribute<User>;
	declare addUser: NonAttribute<User>;
	declare delUser: NonAttribute<User>;

	declare strStatus: CreationOptional<string>;
	declare amount: CreationOptional<number>;

	// Timestamp
	declare addUserId: CreationOptional<ForeignKey<string>>;
	declare delUserId: CreationOptional<ForeignKey<string>>;
	declare addDate: CreationOptional<Date>;
	declare delDate: CreationOptional<Date>;

	// ----------------- Methods -----------------
	// ----------------- Refactored calculation() -----------------
	async calculation(): Promise<boolean> {
		const me = await PO.scope('me').findByPk(this.id, {
			include: [{ model: POItem, as: 'items' }]
		});

		if (!me) return false;

		//  Refresh Currency Exchange Rates
		await updateRates();

		let subTotal = 0;
		let cost = 0;

		//  Sum all items
		(me.items || []).forEach((item) => {
			const quantity = Number(item.quantity ?? 0);
			const unitPrice = Number(item.unitPrice ?? 0);
			const unitCost = Number(item.unitCost ?? 0);

			subTotal += quantity * unitPrice;
			cost += quantity * unitCost;
		});

		//  Update amounts
		me.subTotal = subTotal;
		me.cost = cost;

		//  Update status based on amounts
		if (me.status === Status.Received && subTotal > 0.01) me.status = Status.OnRevision;
		else if (subTotal <= 0.01) me.status = Status.Received;

		await me.save();
		return true;
	}

	async associations(items: CreationAttributes<POItem>[], user: User): Promise<void> {
		const poId = this.id;
		await POItem.updating({ items, poId, addUserId: user.id });
		return;
	}

	statusChangeValidator(): { err?: string } {
		return { err: 'Change status is not allowed' };
	}

	static associationsValidation(companyId: string, req: Request): Promise<{ err?: string }> {
		return Promise.resolve({});
	}

	static async dataValidation(args: {
		req: Request;
		putModel?: PO;
	}): Promise<{ model?: PO; message?: string; status?: number }> {
		const { req, putModel } = args;
		const isPost = req.method === 'POST';

		let body = trimProperties(req.body);
		body = _.pick(body, [
			'companyId',
			'buyerId',
			'poNumber',
			'poDate',
			'deliveryDate',
			'discount',
			'taxPerc',
			'currencyCode',
			'items',
			'salesUserId',
			'setStatus'
		]);

		if (body.items) body.items = POItem.pick(body.items);

		const schema = Joi.object({
			poNumber: Joi.string().allow('', null).max(100),
			poDate: Joi.date(),
			deliveryDate: Joi.date(),
			companyId: isPost ? Joi.string().allow('', null).max(25).required() : Joi.forbidden(),
			buyerId: isPost ? Joi.string().allow('', null).max(25).required() : Joi.string().allow('', null).max(25),
			discount: Joi.number().min(0),
			taxPerc: Joi.number().min(0).less(1),
			currencyCode: Joi.string().allow('', null).max(5),
			setStatus: Joi.number().allow(Status.Accepted, Status.Acknowledged, Status.Rejected),
			salesUserId: isPost
				? Joi.string().allow('', null).max(25).required()
				: Joi.string().allow('', null).max(25),
			items: Joi.array().items(poItemSchema())
		});

		const { error } = schema.validate(body);

		if (error) return { message: error.message };

		const model = putModel ?? PO.build(body);

		if (putModel) model.set(body);

		if (isPost) {
			const company = await Company.findByPk(model.companyId);

			if (!company) return { message: '"companyId" is invalid' };

			if (!company.isClient) return { message: '"companyId" is not client' };

			const salesUser = await User.findByPk(model.salesUserId);

			if (!salesUser || !salesUser.isRoleSales) return { message: '"salesUserId" is invalid' };

			const buyer = await Contact.findByPk(model.buyerId);

			if (!buyer) return { message: '"buyerId" is invalid' };

			if (buyer.companyId !== company.id) return { message: '"buyerId" does not belong to company' };
		}

		if (body.setStatus) model.status = body.setStatus;

		const opt: any = {
			where: {
				active: true,
				poNumber: body.poNumber ?? model.poNumber,
				companyId: body.companyId ?? model.companyId
			}
		};

		if (!isPost) opt.where.id = { [Op.ne]: model.id };

		const dup = await PO.findOne(opt);

		if (dup) return { message: Messages.code400_1 };

		return { model };
	}
}

PO.init(
	{
		id: {
			type: DataTypes.STRING(25),
			defaultValue: () => Math.random().toString(36).slice(2, 27),
			primaryKey: true
		},
		active: { type: DataTypes.BOOLEAN, defaultValue: true },

		status: { type: DataTypes.TINYINT, defaultValue: Status.Received },
		poNumber: { type: DataTypes.STRING(100), allowNull: false },
		poDate: { type: DataTypes.DATE, allowNull: false },
		deliveryDate: { type: DataTypes.DATE, allowNull: false },

		subTotal: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		discount: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		taxPerc: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0.16 },

		taxAmount: {
			type: VIRTUAL,
			get() {
				const subTotal = Number(this.getDataValue('subTotal') ?? 0);
				const discount = Number(this.getDataValue('discount') ?? 0);
				const taxPerc = Number(this.getDataValue('taxPerc') ?? 0);
				return (subTotal - discount) * taxPerc;
			}
		},
		total: {
			type: VIRTUAL,
			get() {
				const subTotal = Number(this.getDataValue('subTotal') ?? 0);
				const discount = Number(this.getDataValue('discount') ?? 0);
				const taxPerc = Number(this.getDataValue('taxPerc') ?? 0);
				return (subTotal - discount) * (1 + taxPerc);
			}
		},

		cost: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		profit: {
			type: VIRTUAL,
			get() {
				const subTotal = Number(this.getDataValue('subTotal') ?? 0);
				const discount = Number(this.getDataValue('discount') ?? 0);
				const cost = Number(this.getDataValue('cost') ?? 0);
				return subTotal - discount - cost;
			}
		},
		profitPerc: {
			type: VIRTUAL,
			get() {
				const subTotal = Number(this.getDataValue('subTotal') ?? 0);
				const discount = Number(this.getDataValue('discount') ?? 0);
				const cost = Number(this.getDataValue('cost') ?? 0);
				const profit = subTotal - discount - cost;
				const netRevenue = subTotal - discount;
				return netRevenue === 0 ? 0 : (profit / netRevenue) * 100;
			}
		},
		amount: {
			type: VIRTUAL,
			get() {
				const status = this.getDataValue('status') ?? 0;

				if (status < Status.Received) return 0;

				const subTotal = Number(this.getDataValue('subTotal') ?? 0);
				const discount = Number(this.getDataValue('discount') ?? 0);
				const taxPerc = Number(this.getDataValue('taxPerc') ?? 0);
				return (subTotal - discount) * (1 + taxPerc);
			}
		},
		strStatus: {
			type: VIRTUAL,
			get() {
				switch (this.getDataValue('status')) {
					case Status.Received:
						return 'Received';
					case Status.OnRevision:
						return 'On Revision';
					case Status.Accepted:
						return 'Accepted';
					case Status.Acknowledged:
						return 'Acknowledged';
					case Status.InProgress:
						return 'In Progress';
					case Status.Completed:
						return 'Completed';
					case Status.Rejected:
						return 'Rejected';
					case Status.Cancelled:
						return 'Cancelled';
					default:
						return 'Unknown';
				}
			}
		},

		discountType: { type: DataTypes.TINYINT, defaultValue: 0 },
		discountPerc: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },

		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		delDate: { type: DataTypes.DATE, allowNull: true }
	},
	{
		sequelize,
		modelName: 'po',
		timestamps: false,
		defaultScope: { attributes: { exclude: ['addDate', 'delDate'] } },
		scopes: {
			read: {
				include: [
					{ model: Company, as: 'company' },
					{ model: User.scope('short'), as: 'addUser' },
					{ model: User.scope('short'), as: 'salesUser' }
				]
			},
			me: {
				include: [
					{ model: Company, as: 'company' },
					{ model: User.scope('short'), as: 'addUser' },
					{ model: User.scope('short'), as: 'salesUser' },
					{ model: Contact.scope('short'), as: 'buyer' },
					{ model: POItem, as: 'items' },
					{ model: Currency, as: 'currency' }
				],
				order: [['items', 'order', 'ASC']]
			}
		}
	}
);

export default PO;
