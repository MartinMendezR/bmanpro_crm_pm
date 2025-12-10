import { UserAttributes } from '@/models/user';

/**
 * This method authorizes the user to perform post, put or delete methods
 *
 * @param params
 * @returns Empty object when user is authorized. Otherwise, the object has a 'errMessage' property
 */
export const isForbidden = (
	user: UserAttributes,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	modelName: string,
	addUserId?: string
): { errMessage?: string } => {
	//   System user can do anything!
	if (user.isRoleSystem) return {};

	const mUser = modelName === 'user';
	const mCompany = modelName === 'company';
	const mContact = modelName === 'contact';
	const mOpportunity = modelName === 'opportunity';
	const mQuote = modelName === 'quote';
	const mPOs = modelName === 'po';
	const mTasks = modelName === 'task';

	let action: 'create' | 'read' | 'update' | 'delete' = 'create';

	if (method === 'GET') action = 'read';
	else if (method === 'PUT') action = 'update';
	else if (method === 'DELETE') action = 'delete';

	let modelDesc = 'users';

	if (mCompany) modelDesc = 'companies';
	else if (mContact) modelDesc = 'contacts';
	else if (mOpportunity) modelDesc = 'opportunities';
	else if (mQuote) modelDesc = 'quotes';
	else if (mPOs) modelDesc = 'pos';
	else if (mTasks) modelDesc = 'tasks';

	//   default errMessage
	const errMessage = 'Not authorized to ' + action + ' ' + modelDesc;

	//   non admin/PM users cannot CRUD users
	if (mUser && !user.isRoleAdmin && !user.isRolePM) return { errMessage };

	//   Companies OR Contacts
	if (mCompany || mContact) {
		//   admin users can CRUD companies/contacts
		if (user.isRoleAdmin) return {};

		//   sales and estimators users can create companies/contacts - for update depends on model dataValidation
		if (user.isRoleSales || user.isRoleEstimator) return {};
	}

	//   Opportunities
	if (mOpportunity) {
		//   admin users can CRUD opportunities
		if (user.isRoleAdmin) return {};

		//   sales and estimators users can create companies/contacts - for update depends on model dataValidation
		if (user.isRoleSales || user.isRoleEstimator) return {};
	}

	//   Quotes
	if (mQuote) {
		//   admin users can CRUD quotes
		if (user.isRoleAdmin || user.isRoleEstimator) return {};
	}

	//   POs
	if (mPOs) {
		//   admin users can CRUD POs
		if (user.isRoleAdmin) return {};
	}

	//   POs
	if (mTasks) {
		//   admin users can CRUD Tasks
		if (user.isRoleAdmin || user.isRolePM) return {};
	}

	let allowed = false;

	if (action === 'create')
		allowed =
			(user.authUserAdd && mUser) ||
			(user.authCompanyAdd && mCompany) ||
			(user.authContactAdd && mContact) ||
			(user.authOpportunityAdd && mOpportunity) ||
			(user.authQuoteAdd && mQuote) ||
			(user.authPOAdd && mPOs) ||
			mTasks;
	// anyone can add
	// user can modify / delete if he/she was the addUser
	else if (addUserId === user.id) allowed = true;
	else if (action === 'update')
		allowed =
			(user.authUserMod && mUser) ||
			(user.authCompanyMod && mCompany) ||
			(user.authContactMod && mContact) ||
			(user.authOpportunityMod && mOpportunity) ||
			(user.authQuoteMod && mQuote) ||
			(user.authPOMod && mPOs);
	else if (action === 'delete')
		allowed =
			(user.authUserDel && mUser) ||
			(user.authCompanyDel && mCompany) ||
			(user.authContactDel && mContact) ||
			(user.authOpportunityDel && mOpportunity) ||
			(user.authQuoteDel && mQuote) ||
			(user.authPODel && mPOs);

	return allowed ? {} : { errMessage };
};
/*
export const readQuery: any = (args: { req: Request; attributes: any }) => {
	const { req, attributes } = args;
	const query: any = { where: {} };
	const reqQueryKeys = Object.keys(req.query);
	const user = req.user;

	//   Active
	if (reqQueryKeys.includes('active')) {
		const active = req.query.active?.toString();

		if (active === 'true')
			query.where.active = true; //  Active: true
		else if (active === 'false') query.where.active = false;
		else if (active !== 'all') query.where.active = true; //  if active='all', then skips where.active, and find all users
	} else query.where.active = true;

	//  status
	if (reqQueryKeys.includes('status') && 'status' in attributes)
		query.where = { ...query.where, status: req.query.status };

	//  companyId
	if (reqQueryKeys.includes('companyId')) {
		if ('companyId' in attributes) query.where = { ...query.where, companyId: req.query.companyId };

		//   for quotes... they are related throught opportunities
		if ('quoteNumber' in attributes) {
			query.include = [{ model: Opportunity, as: 'opportunity', where: { companyId: req.query.companyId } }];
		}
	}

	if (reqQueryKeys.includes('contactId') && 'contactId' in attributes)
		query.where = { ...query.where, contactId: req.query.contactId };

	//  opportunityId
	if (reqQueryKeys.includes('opportunityId') && 'opportunityId' in attributes)
		query.where = { ...query.where, opportunityId: req.query.opportunityId };

	//  Range
	if ('startDate' in attributes) {
		const dateFrom = req.query.dateFrom ? new Date(Number(req.query.dateFrom)) : null;
		const dateTo = req.query.dateTo ? new Date(Number(req.query.dateTo)) : null;

		if (dateFrom && dateTo) query.where = { ...query.where, startDate: { [Op.between]: [dateFrom, dateTo] } };
		else if (dateFrom) query.where = { ...query.where, startDate: { [Op.gte]: dateFrom } };
		else if (dateTo) query.where = { ...query.where, startDate: { [Op.lt]: dateTo } };
	}

	//   User Model
	if ('username' in attributes) {
		//  Queries based on roles
		if (reqQueryKeys.includes('role')) {
			const queryRoles = req.query.role as string[];
			const roles = [];

			if (req.query.role === 'system' || queryRoles.includes('system')) roles.push({ isRoleSystem: true });

			if (req.query.role === 'admin' || queryRoles.includes('admin')) roles.push({ isRoleAdmin: true });

			if (req.query.role === 'sales' || queryRoles.includes('sales')) roles.push({ isRoleSales: true });

			if (req.query.role === 'estimator' || queryRoles.includes('estimator'))
				roles.push({ isRoleEstimator: true });

			if (req.query.role === 'pm' || queryRoles.includes('pm')) roles.push({ isRolePM: true });

			if (req.query.role === 'service' || queryRoles.includes('service')) roles.push({ isRoleService: true });

			if (roles.length > 0) query.where = { ...query.where, [Op.or]: roles };
		}
	}

	//   Companies
	//   if attributes have 'region' the model is a company
	if ('region' in attributes) {
		//   company state
		if (reqQueryKeys.includes('state')) query.where = { ...query.where, state: req.query.state };

		if (reqQueryKeys.includes('relation')) {
			//   query.relation could be like:
			//   ?relation='client'
			//   ?relation='client'&&relation='competitor'    ... this will be cast as string[]

			const queryRelations = req.query.relation as string[];
			const relations = [];

			if (req.query.relation === 'client' || queryRelations.includes('client'))
				relations.push({ isClient: true });

			if (req.query.relation === 'partner' || queryRelations.includes('partner'))
				relations.push({ isPartner: true });

			if (req.query.relation === 'supplier' || queryRelations.includes('supplier'))
				relations.push({ isSupplier: true });

			if (req.query.relation === 'competitor' || queryRelations.includes('competitor'))
				relations.push({ isCompetitor: true });

			if (relations.length > 0) query.where = { ...query.where, [Op.or]: relations };
		}

		if (!user.isRoleSystem && !user.isRoleAdmin && !user.authCompanyAll)
			query.where = { ...query.where, [Op.or]: [{ addUserId: user.id }, { salesUserId: user.id }] };
	}

	if ('responsibleId' in attributes && !reqQueryKeys.includes('others')) {
		// Task model: only return tasks where addUserId or responsibleId matches current user
		query.where = {
			...query.where,
			[Op.or]: [{ addUserId: user.id }, { responsibleId: user.id }]
		};
	}

	return query;
};
*/
