import _ from 'lodash';
import {
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	ForeignKey,
	NonAttribute
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import { trimProperties } from '@/lib/format';
import Joi from 'joi';
import User from './user';
import Opportunity from './opportunity';
import Quote from './quote';
import PO from './po';
import { BaseModel } from './_baseModel';

export enum Messages {
	code400 = 'Task has already deleted',
	code400_1 = 'Task has active contacts',
	code400_2 = 'Only one of opportunityId, quoteId, or poId can be provided',
	code403 = 'User is not authorized',
	code404 = 'Task was not found'
}

export enum Status {
	Schedulled = 10,
	Acknowledged = 20,
	InProgress = 100,
	Completed = 200,
	Rejected = 250,
	Cancelled = 251
}

class Task extends BaseModel<InferAttributes<Task>, InferCreationAttributes<Task>> {
	declare id: CreationOptional<string>;
	declare status: CreationOptional<Status>;

	declare name: string;
	declare description: string;
	declare progress: number;
	declare startDate: Date;
	declare dueDate: CreationOptional<Date | null>;
	declare endDate: CreationOptional<Date | null>;

	// Associations
	declare responsibleId: ForeignKey<string>;
	declare opportunityId: CreationOptional<ForeignKey<string | null>>;
	declare quoteId: CreationOptional<ForeignKey<string | null>>;
	declare poId: CreationOptional<ForeignKey<string | null>>;

	declare responsible?: NonAttribute<User>;
	declare opportunity?: NonAttribute<Opportunity>;
	declare quote?: NonAttribute<Quote>;
	declare po?: NonAttribute<PO>;

	/** Validate request body for creating/updating a Task */
	static async dataValidation(args: {
		req: Request;
		putModel?: Task;
	}): Promise<{ model?: Task; message?: string; status?: number }> {
		const { req, putModel } = args;
		const isPost = req.method === 'POST';

		let body = trimProperties(req.body);
		body = _.omit(body, [
			'id',
			'active',
			'addUserId',
			'delUserId',
			'addDate',
			'delDate',
			'addUser',
			'responsible',
			'opportunity',
			'quote',
			'po'
		]);

		const schema = Joi.object({
			name: isPost ? Joi.string().min(1).max(255).required() : Joi.string().min(1).max(255),
			responsibleId: isPost ? Joi.string().max(25).required() : Joi.string().max(25),
			startDate: isPost ? Joi.date().required() : Joi.date(),
			setStatus: Joi.number().valid(...Object.values(Status)),
			description: Joi.string().allow('', null),
			progress: Joi.number().min(0).max(100),
			endDate: Joi.date(),
			dueDate: Joi.date(),
			opportunityId: Joi.string().max(25).allow('', null),
			quoteId: Joi.string().max(25).allow('', null),
			poId: Joi.string().max(25).allow('', null)
		});

		const { error } = schema.validate(body);

		if (error) return { message: error.message };

		const model = putModel ?? Task.build(body);

		if (putModel) model.set(body);

		// Only one of opportunityId, quoteId, poId can be set
		const ids = [model.opportunityId, model.quoteId, model.poId].filter(Boolean);

		if (ids.length > 1) return { message: Messages.code400_2 };

		// Validate foreign keys exist
		if (model.responsibleId && !(await User.findByPk(model.responsibleId)))
			return { message: '"responsibleId" is invalid' };

		if (model.opportunityId && !(await Opportunity.findByPk(model.opportunityId)))
			return { message: '"opportunityId" is invalid' };

		if (model.quoteId && !(await Quote.findByPk(model.quoteId))) return { message: '"quoteId" is invalid' };

		if (model.poId && !(await PO.findByPk(model.poId))) return { message: '"poId" is invalid' };

		return { model };
	}
}

Task.init(
	{
		id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
		status: { type: DataTypes.TINYINT, defaultValue: Status.Schedulled },
		progress: { type: DataTypes.TINYINT, defaultValue: 0, comment: '0 - 100 progress percentage' },
		name: { type: DataTypes.STRING(255), allowNull: false, validate: { min: 1, max: 255 } },
		description: { type: DataTypes.TEXT },
		startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		endDate: { type: DataTypes.DATE },
		dueDate: { type: DataTypes.DATE },

		// Audit fields
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		addDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
		addUserId: { type: DataTypes.UUID, allowNull: false },
		delUserId: DataTypes.UUID,
		delDate: DataTypes.DATE,

		responsibleId: { type: DataTypes.UUID, allowNull: false },
		opportunityId: DataTypes.UUID,
		quoteId: DataTypes.UUID,
		poId: DataTypes.UUID
	},
	{
		sequelize,
		modelName: 'task',
		timestamps: false,
		defaultScope: {
			attributes: { exclude: ['addDate', 'delDate'] }
		},
		scopes: {
			read: () => ({
				include: [
					{ model: User.scope('short'), as: 'responsible' },
					{ model: User.scope('short'), as: 'addUser' },
					{ model: Opportunity, as: 'opportunity' },
					{ model: Quote, as: 'quote' },
					{ model: PO, as: 'po' }
				],
				order: [['startDate', 'ASC']]
			}),
			me: () => ({
				include: [
					{ model: User.scope('short'), as: 'addUser' },
					{ model: User.scope('short'), as: 'responsible' },
					{ model: Opportunity, as: 'opportunity' },
					{ model: Quote, as: 'quote' },
					{ model: PO, as: 'po' }
				]
			}),
			association: () => ({
				include: [
					{ model: User.scope('short'), as: 'addUser' },
					{ model: User.scope('short'), as: 'responsible' }
				]
			}),
			short: () => ({
				attributes: ['id', 'name', 'description', 'progress']
			})
		}
	}
);

export default Task;
export type CompanyType = Partial<Task>;
