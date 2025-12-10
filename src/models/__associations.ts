import User from './user';
import Config from './__config';
import Company from './company';
import Contact from './contact';
import Opportunity from './opportunity';
import OpportunityPart from './opportunityPart';
import OpportunityContact from './_opportunitiesContacts';
import OpportunityProposal from './_opportunitiesProposals';
import Quote from './quote';
import QuotePart from './quotePart';
import QuoteContact from './_quotesContacts';
import QuotePartItem from './quotePartItem';
import QuotePartItemCost from './quotePartItemCost';
import Currency from './currency';
import PO from './po';
import POItem from './poItem';
import Task from './task';

//   Config
Config.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });

//   Users
User.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId' } });
User.belongsTo(User, { as: 'delUser', foreignKey: { name: 'delUserId' } });
User.belongsToMany(Opportunity, {
	as: 'opportunities',
	through: OpportunityProposal,
	foreignKey: { name: 'proposalId', allowNull: false }
});
User.hasMany(Task, { as: 'tasks', foreignKey: { name: 'responsibleId', allowNull: false } });

//   Company
Company.belongsTo(User, { as: 'salesUser', foreignKey: { name: 'salesUserId' } });
Company.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
Company.belongsTo(User, { as: 'delUser', foreignKey: { name: 'delUserId' } });
Company.hasMany(Contact, { as: 'contacts' });
Company.hasMany(Opportunity, { as: 'opportunities' });

//   Contact
Contact.belongsTo(Company, { as: 'company', foreignKey: { name: 'companyId', allowNull: false } });
Contact.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
Contact.belongsTo(User, { as: 'delUser', foreignKey: { name: 'delUserId' } });
Contact.belongsToMany(Opportunity, {
	as: 'opportunities',
	through: OpportunityContact,
	foreignKey: { name: 'contactId', allowNull: false }
});
Contact.belongsToMany(Quote, {
	as: 'quotes',
	through: QuoteContact,
	foreignKey: { name: 'contactId', allowNull: false }
});

//  Opportunity
Opportunity.belongsTo(Company, { as: 'company', foreignKey: { name: 'companyId', allowNull: false } });
Opportunity.belongsTo(User, { as: 'salesUser', foreignKey: { name: 'salesUserId', allowNull: false } });
Opportunity.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
Opportunity.belongsTo(User, { as: 'delUser', foreignKey: { name: 'delUserId' } });
Opportunity.belongsTo(Currency, { as: 'currency', foreignKey: { name: 'currencyCode' } });
Opportunity.hasMany(OpportunityPart, { as: 'parts' });
Opportunity.hasMany(OpportunityContact, { as: 'contacts' });
Opportunity.hasMany(Quote, { as: 'quotes' });
Opportunity.hasMany(Task, { as: 'tasks', foreignKey: { name: 'opportunityId' } });

OpportunityPart.belongsTo(Opportunity, { as: 'opportunity', foreignKey: { name: 'opportunityId', allowNull: false } });
OpportunityPart.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
Opportunity.belongsToMany(User, {
	as: 'proposals',
	through: OpportunityProposal,
	foreignKey: { name: 'opportunityId', allowNull: false }
});

OpportunityContact.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
OpportunityContact.belongsTo(Contact, { as: 'contact', foreignKey: { name: 'contactId', allowNull: false } });

Quote.belongsTo(Quote, { as: 'revisedQuote', foreignKey: { name: 'revisedQuoteId' } });
Quote.belongsTo(Opportunity, { as: 'opportunity', foreignKey: { name: 'opportunityId', allowNull: false } });
Quote.belongsTo(User, { as: 'salesUser', foreignKey: { name: 'salesUserId', allowNull: false } });
Quote.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
Quote.belongsTo(User, { as: 'delUser', foreignKey: { name: 'delUserId' } });
Quote.belongsTo(Currency, { as: 'currency', foreignKey: { name: 'currencyCode' } });
Quote.hasMany(QuotePart, { as: 'parts' });
Quote.hasMany(QuoteContact, { as: 'contacts' });
Quote.hasMany(Task, { as: 'tasks', foreignKey: { name: 'quoteId' } });
QuoteContact.belongsTo(Contact, { as: 'contact', foreignKey: { name: 'contactId', allowNull: false } });

QuotePart.belongsTo(Quote, { as: 'quote', foreignKey: { name: 'quoteId', allowNull: false } });
QuotePart.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
QuotePart.belongsTo(OpportunityPart, { as: 'opportunityPart', foreignKey: { name: 'opportunityPartId' } });
QuotePart.hasMany(QuotePartItem, { as: 'items' });

QuotePartItem.belongsTo(QuotePart, { as: 'part', foreignKey: { name: 'quotePartId', allowNull: false } });
QuotePartItem.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
QuotePartItem.hasMany(QuotePartItemCost, { as: 'costs' });

QuotePartItemCost.belongsTo(QuotePartItem, { as: 'item', foreignKey: { name: 'quotePartItemId', allowNull: false } });
QuotePartItemCost.belongsTo(Currency, { as: 'currency', foreignKey: { name: 'currencyCode' } });
QuotePartItemCost.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });

PO.belongsTo(User, { as: 'salesUser', foreignKey: { name: 'salesUserId', allowNull: false } });
PO.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
PO.belongsTo(User, { as: 'delUser', foreignKey: { name: 'delUserId' } });
PO.belongsTo(Company, { as: 'company', foreignKey: { name: 'companyId', allowNull: false } });
PO.belongsTo(Contact, { as: 'buyer', foreignKey: { name: 'buyerId', allowNull: false } });
PO.belongsTo(Currency, { as: 'currency', foreignKey: { name: 'currencyCode', allowNull: false } });
PO.hasMany(POItem, { as: 'items' });
PO.hasMany(Task, { as: 'tasks', foreignKey: { name: 'poId' } });

POItem.belongsTo(PO, { as: 'po', foreignKey: { name: 'poId', allowNull: false } });
POItem.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
POItem.belongsTo(QuotePartItem, { as: 'quotePartItem', foreignKey: { name: 'quotePartItemId' } });

//  Task
Task.belongsTo(User, { as: 'addUser', foreignKey: { name: 'addUserId', allowNull: false } });
Task.belongsTo(User, { as: 'delUser', foreignKey: { name: 'delUserId' } });
Task.belongsTo(User, { as: 'responsible', foreignKey: { name: 'responsibleId', allowNull: false } });
Task.belongsTo(Opportunity, { as: 'opportunity', foreignKey: { name: 'opportunityId' } });
Task.belongsTo(Quote, { as: 'quote', foreignKey: { name: 'quoteId' } });
Task.belongsTo(PO, { as: 'po', foreignKey: { name: 'poId' } });
