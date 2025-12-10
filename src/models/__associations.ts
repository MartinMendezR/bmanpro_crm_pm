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

// CONFIG
Config.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });

// USERS
User.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
User.belongsTo(User, { as: 'delUser', foreignKey: 'delUserId' });
User.belongsToMany(Opportunity, { as: 'opportunities', through: OpportunityProposal, foreignKey: 'proposalId' });
User.hasMany(Task, { as: 'tasks', foreignKey: 'responsibleId' });

// COMPANY
Company.belongsTo(User, { as: 'salesUser', foreignKey: 'salesUserId' });
Company.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
Company.belongsTo(User, { as: 'delUser', foreignKey: 'delUserId' });
Company.hasMany(Contact, { as: 'contacts' });
Company.hasMany(Opportunity, { as: 'opportunities' });

// CONTACT
Contact.belongsTo(Company, { as: 'company', foreignKey: 'companyId' });
Contact.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
Contact.belongsTo(User, { as: 'delUser', foreignKey: 'delUserId' });
Contact.belongsToMany(Opportunity, { as: 'opportunities', through: OpportunityContact, foreignKey: 'contactId' });
Contact.belongsToMany(Quote, { as: 'quotes', through: QuoteContact, foreignKey: 'contactId' });

// OPPORTUNITY
Opportunity.belongsTo(Company, { as: 'company', foreignKey: 'companyId' });
Opportunity.belongsTo(User, { as: 'salesUser', foreignKey: 'salesUserId' });
Opportunity.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
Opportunity.belongsTo(User, { as: 'delUser', foreignKey: 'delUserId' });
Opportunity.belongsTo(Currency, { as: 'currency', foreignKey: 'currencyCode' });
Opportunity.hasMany(OpportunityPart, { as: 'parts' });
Opportunity.hasMany(OpportunityContact, { as: 'contacts' });
Opportunity.hasMany(Quote, { as: 'quotes' });
Opportunity.hasMany(Task, { as: 'tasks', foreignKey: 'opportunityId' });
Opportunity.belongsToMany(User, { as: 'proposals', through: OpportunityProposal, foreignKey: 'opportunityId' });

OpportunityPart.belongsTo(Opportunity, { as: 'opportunity', foreignKey: 'opportunityId' });
OpportunityPart.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });

OpportunityContact.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
OpportunityContact.belongsTo(Contact, { as: 'contact', foreignKey: 'contactId' });

// QUOTE
Quote.belongsTo(Quote, { as: 'revisedQuote', foreignKey: 'revisedQuoteId' });
Quote.belongsTo(Opportunity, { as: 'opportunity', foreignKey: 'opportunityId' });
Quote.belongsTo(User, { as: 'salesUser', foreignKey: 'salesUserId' });
Quote.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
Quote.belongsTo(User, { as: 'delUser', foreignKey: 'delUserId' });
Quote.belongsTo(Currency, { as: 'currency', foreignKey: 'currencyCode' });
Quote.hasMany(QuotePart, { as: 'parts' });
Quote.hasMany(QuoteContact, { as: 'contacts' });
Quote.hasMany(Task, { as: 'tasks', foreignKey: 'quoteId' });

QuoteContact.belongsTo(Contact, { as: 'contact', foreignKey: 'contactId' });

// QUOTE PART
QuotePart.belongsTo(Quote, { as: 'quote', foreignKey: 'quoteId' });
QuotePart.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
QuotePart.belongsTo(OpportunityPart, { as: 'opportunityPart', foreignKey: 'opportunityPartId' });
QuotePart.hasMany(QuotePartItem, { as: 'items' });

QuotePartItem.belongsTo(QuotePart, { as: 'part', foreignKey: 'quotePartId' });
QuotePartItem.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
QuotePartItem.hasMany(QuotePartItemCost, { as: 'costs' });

QuotePartItemCost.belongsTo(QuotePartItem, { as: 'item', foreignKey: 'quotePartItemId' });
QuotePartItemCost.belongsTo(Currency, { as: 'currency', foreignKey: 'currencyCode' });
QuotePartItemCost.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });

// PO
PO.belongsTo(User, { as: 'salesUser', foreignKey: 'salesUserId' });
PO.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
PO.belongsTo(User, { as: 'delUser', foreignKey: 'delUserId' });
PO.belongsTo(Company, { as: 'company', foreignKey: 'companyId' });
PO.belongsTo(Contact, { as: 'buyer', foreignKey: 'buyerId' });
PO.belongsTo(Currency, { as: 'currency', foreignKey: 'currencyCode' });
PO.hasMany(POItem, { as: 'items' });
PO.hasMany(Task, { as: 'tasks', foreignKey: 'poId' });

POItem.belongsTo(PO, { as: 'po', foreignKey: 'poId' });
POItem.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
POItem.belongsTo(QuotePartItem, { as: 'quotePartItem', foreignKey: 'quotePartItemId' });

// TASK
Task.belongsTo(User, { as: 'addUser', foreignKey: 'addUserId' });
Task.belongsTo(User, { as: 'delUser', foreignKey: 'delUserId' });
Task.belongsTo(User, { as: 'responsible', foreignKey: 'responsibleId' });
Task.belongsTo(Opportunity, { as: 'opportunity', foreignKey: 'opportunityId' });
Task.belongsTo(Quote, { as: 'quote', foreignKey: 'quoteId' });
Task.belongsTo(PO, { as: 'po', foreignKey: 'poId' });
