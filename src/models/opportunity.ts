import _ from 'lodash';
import {
	Op,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	ForeignKey,
	NonAttribute,
	VIRTUAL
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import { trimProperties } from '@/lib/format';
import Joi from 'joi';
import Company from './company';
import User from './user';
import Contact from './contact';
import OpportunityPart from './opportunityPart';
import OpportunityContact from './_opportunitiesContacts';
import OpportunityProposal from './_opportunitiesProposals';
import Currency from './currency';
import Quote from './quote';
import { DateTime } from 'luxon';
import { BaseModel } from './_baseModel';

export enum Messages {
	code400 = 'Opportunity was already deleted',
	code400_1 = 'Duplicated Opportunity',
	code400_2 = 'Opportunity status is invalid',
	code400_10 = 'Opportunity needs to have parts to be changed as RFQ',
	code400_11 = 'Opportunity needs to have contacts to be changed as RFQ',
	code400_12 = 'Opportunity needs to have proposals to be changed as RFQ',
	code403 = 'User is not authorized',
	code404 = 'Opportunity was not found'
}

export enum Status {
	Lead = 0,
	RFQ = 10,
	Quoted = 20,
	Won = 100,
	Lost = 200,
	Cancelled = 210
}

// Model
class Opportunity extends BaseModel<InferAttributes<Opportunity>, InferCreationAttributes<Opportunity>> {
	declare id: CreationOptional<string>;

	declare status: CreationOptional<Status>;
	declare name: string;
	declare note: CreationOptional<string>;
	declare amountEstimated: CreationOptional<number>;
	declare amountQuoted: CreationOptional<number>;
	declare amountWon: CreationOptional<number>;

	declare addDate: CreationOptional<Date>;
	declare delDate: CreationOptional<Date>;

	// Virtuals
	declare date: CreationOptional<Date>;
	declare amount: CreationOptional<number>;
	declare strStatus: CreationOptional<string>;

	// Associations
	declare companyId: ForeignKey<string>;
	declare salesUserId: ForeignKey<string>;
	declare currencyCode: ForeignKey<string>;

	declare currency?: NonAttribute<Currency>;
	declare company?: NonAttribute<Company>;
	declare salesUser?: NonAttribute<User>;

	declare parts?: NonAttribute<OpportunityPart[]>;
	declare contacts?: NonAttribute<OpportunityContact[]>;
	declare proposals?: NonAttribute<OpportunityProposal[]>;
	declare quotes?: NonAttribute<Quote[]>;

	// Data validation
	static async dataValidation(args: {
		req: Request;
		putModel?: Opportunity;
		user: User;
	}): Promise<{ model?: Opportunity; message?: string; status?: number }> {
		const { req, putModel, user } = args;
		const isPost = req.method === 'POST';

		let body = trimProperties(req.body);
		body = _.omit(body, [
			'id',
			'active',
			'status',
			'amount',
			'addUserId',
			'delUserId',
			'addDate',
			'delDate',
			'addUser',
			'date',
			'salesUser',
			'company',
			'contacts',
			'quotes',
			'projects',
			'opportunities',
			'amountQuoted',
			'amountWon',
			'strStatus'
		]);

		const partSchema = Joi.object({
			id: Joi.string().allow(null).max(25),
			name: Joi.string().min(1).max(250),
			description: Joi.string().allow('', null)
		});

		const contactSchema = Joi.object({
			id: Joi.string().allow(null).max(25),
			canDecide: Joi.boolean(),
			toQuote: Joi.boolean(),
			note: Joi.string().allow('', null),
			contactId: Joi.string().max(25).required()
		});

		const proposalSchema = Joi.object({
			proposalId: isPost ? Joi.string().allow('', null).max(25).required() : Joi.string().allow('', null).max(25)
		});

		const schema = Joi.object({
			name: isPost ? Joi.string().min(1).max(250).required() : Joi.string().min(1).max(250),
			note: Joi.string().allow('', null),
			currencyCode: Joi.string().max(25),
			amountEstimated: Joi.number().min(0),
			salesUserId: Joi.string().allow('', null).max(25),
			companyId: isPost ? Joi.string().allow('', null).max(25).required() : Joi.string().allow('', null).max(25),
			parts: Joi.array().items(partSchema),
			contacts: Joi.array().items(contactSchema),
			proposals: Joi.array().items(proposalSchema)
		});

		const { error } = schema.validate(body);

		if (error) return { message: error.message };

		const model = putModel ?? Opportunity.build(body);

		if (putModel) model.set(body);

		if (isPost && !body.salesUserId) {
			if (user.isRoleSales) model.salesUserId = user.id;
			else return { message: '"salesUserId" is required' };
		}

		const company = await Company.findByPk(model.companyId ?? '');

		if (!company) return { message: '"companyId" is invalid' };

		if (body.salesUserId) {
			const salesUser = await User.findByPk(body.salesUserId ?? '');

			if (!salesUser) return { message: '"salesUserId" is invalid' };
		}

		const oneWeekAgo = DateTime.now().minus({ week: 1 }).toJSDate();
		const opt: any = {
			where: {
				active: true,
				companyId: model.companyId,
				addDate: { [Op.gt]: oneWeekAgo },
				name: body.name ?? model.name
			}
		};

		if (!isPost) opt.where.id = { [Op.ne]: model.id };

		const dup = await Opportunity.findOne(opt);

		if (dup) return { message: Messages.code400_1 };

		if (body.contacts && body.contacts.length > 0) {
			const invalidContacts = await Promise.all(
				body.contacts.map(async (c: any) => {
					const contact = await Contact.findOne({ where: { id: c.contactId, companyId: model.companyId } });
					return contact ? null : c.contactId;
				})
			);

			if (invalidContacts.filter(Boolean).length > 0) return { message: '"contacts" invalid' };
		}

		return { model };
	}

	async associations(args: {
		user: User;
		parts?: OpportunityPart[];
		contacts?: OpportunityContact[];
		proposals?: OpportunityProposal[];
	}): Promise<boolean> {
		const { user, parts, contacts, proposals } = args;
		const promises: Promise<any>[] = [];

		if (parts) {
			const ids = parts.filter((p) => !!p.id).map((p) => p.id);
			const existingParts = await OpportunityPart.findAll({ where: { opportunityId: this.id } });
			const delIds = existingParts.filter((p) => !ids.includes(p.id)).map((p) => p.id);
			await OpportunityPart.destroy({ where: { id: { [Op.in]: delIds } } });

			parts.forEach((part, idx) => {
				if (part.id) {
					promises.push(OpportunityPart.update({ ...part, order: idx + 1 }, { where: { id: part.id } }));
				} else {
					promises.push(
						OpportunityPart.create({ ...part, order: idx + 1, addUserId: user.id, opportunityId: this.id })
					);
				}
			});
		}

		if (contacts) {
			const ids = contacts.filter((c) => !!c.id).map((c) => c.id!);
			const existingContacts = await OpportunityContact.findAll({ where: { opportunityId: this.id } });
			const delIds = existingContacts.filter((c) => !ids.includes(c.id)).map((c) => c.id);
			await OpportunityContact.destroy({ where: { id: { [Op.in]: delIds } } });

			contacts.forEach((contact) => {
				if (contact.id) promises.push(OpportunityContact.update(contact, { where: { id: contact.id } }));
				else
					promises.push(
						OpportunityContact.create({ ...contact, opportunityId: this.id, addUserId: user.id })
					);
			});
		}

		if (proposals) {
			const ids = proposals.filter((p) => !!p.proposalUserId).map((p) => p.proposalUserId!);
			const existingProposals = await OpportunityProposal.findAll({ where: { opportunityId: this.id } });
			const delIds = existingProposals
				.filter((p) => !ids.includes(p.proposalUserId))
				.map((p) => p.proposalUserId);
			await OpportunityProposal.destroy({
				where: { proposalUserId: { [Op.in]: delIds }, opportunityId: this.id }
			});

			proposals.forEach((proposal) => {
				if (!proposal.proposalUserId)
					promises.push(OpportunityProposal.create({ ...proposal, opportunityId: this.id }));
			});
		}

		await Promise.all(promises);
		return true;
	}
}

Opportunity.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		status: { type: DataTypes.TINYINT, defaultValue: Status.Lead },
		name: { type: DataTypes.STRING(250), allowNull: false },
		note: { type: DataTypes.TEXT },
		amountEstimated: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		amountQuoted: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
		amountWon: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },

		// Audit fields
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		addUserId: { type: DataTypes.UUID, allowNull: false },
		delUserId: DataTypes.UUID,
		delDate: DataTypes.DATE,

		companyId: { type: DataTypes.UUID, allowNull: false },
		salesUserId: { type: DataTypes.UUID },
		currencyCode: { type: DataTypes.STRING(5) },

		// Virtuals
		date: {
			type: VIRTUAL,
			get() {
				return this.getDataValue('delDate') || this.getDataValue('addDate');
			}
		},
		amount: {
			type: VIRTUAL,
			get() {
				let res = this.getDataValue('amountWon');

				if (res <= 0) res = this.getDataValue('amountQuoted');

				if (res <= 0) res = this.getDataValue('amountEstimated');

				return res;
			}
		},
		strStatus: {
			type: VIRTUAL,
			get() {
				const status = this.getDataValue('status');

				if (status === Status.Lead) return 'Lead';

				if (status === Status.RFQ) return 'RFQ';

				if (status === Status.Quoted) return 'Quoted';

				if (status === Status.Won) return 'Won';

				if (status === Status.Lost) return 'Lost';

				return 'Cancelled';
			}
		}
	},
	{
		sequelize,
		modelName: 'opportunity',
		timestamps: false,
		scopes: {
			read: () => ({
				include: [
					{ model: Company.scope('short'), as: 'company' },
					{ model: User.scope('short'), as: 'salesUser' },
					{ model: OpportunityPart.scope('short'), as: 'parts' }
				],
				order: [
					['status', 'ASC'],
					['addDate', 'DESC']
				]
			}),
			me: () => ({
				include: [
					{ model: Company.scope('short'), as: 'company' },
					{ model: User.scope('short'), as: 'addUser' },
					{ model: User.scope('short'), as: 'salesUser' },
					{ model: OpportunityPart, as: 'parts' },
					{
						model: OpportunityContact,
						as: 'contacts',
						required: false,
						include: [{ model: Contact, as: 'contact' }]
					},
					{ model: User.scope('short'), as: 'proposals' },
					{ model: Quote, as: 'quotes' }
				],
				order: [['parts', 'order', 'ASC']]
			})
		}
	}
);

export default Opportunity;
