import '../models/__associations';
import sequelize, { getDatabaseName } from './sequelize';
import mysql, { ConnectionOptions } from 'mysql2';
import User from '../models/user';
import Config from '../models/__config';
import { seedCurrencies } from './currency';
import { updateRates } from './exchange';

//  Database Connection
const connectionOptions: ConnectionOptions = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD
};
const mySQLConn = mysql.createConnection(connectionOptions);

const serverConnect = (): Promise<boolean> => {
	return new Promise((resolve) => {
		let message = '                   mySQL Server: ';
		mySQLConn.connect((err) => {
			if (!err) message += '\x1b[92mConnected\x1b[0m';
			else message += '\x1b\x1b[31m' + err + '\x1b[0m';

			console.log(message);
			resolve(!err);
		});
	});
};

const init = async (): Promise<{ message: string }> => {
	//  Connect to Server
	const connected = await serverConnect();

	if (!connected) {
		// Connection Failed
		console.log('Server Connection failed');
		process.exit();
	}

	//  Authenticate Database
	const authenticated = await dbAuthenticate();

	if (authenticated) return { message: 'Database authenticated' };

	// create database
	const created = await createDatabase();

	if (created) {
		await syncDatabase(true);
		await seedDefault();
		await updateRates();
		return { message: 'Database created' };
	} else {
		await updateRates();
		return { message: 'Database was not created' };
	}
};

const dbAuthenticate = (): Promise<boolean> => {
	return new Promise((resolve) => {
		sequelize
			.authenticate()
			.then(() => {
				console.log('                 mySQL Database: \x1b[92mAuthenticated\x1b[0m');
				resolve(true);
			})
			.catch((err) => {
				console.log('                 mySQL Database: \x1b\x1b[31m' + err.original.sqlMessage + '\x1b[0m');
				resolve(false);
			});
	});
};

const createDatabase = (): Promise<boolean> => {
	return new Promise((resolve) => {
		const dbName = getDatabaseName();
		let message = 'Create Database [ ' + dbName + ' ]: ';
		mySQLConn.query('CREATE DATABASE ' + dbName, (err) => {
			if (!err) message += '\x1b[92mOK\x1b[0m';
			else message += '\x1b\x1b[31m' + err + '\x1b[0m';

			console.log(message);
			resolve(!err);
		});
	});
};

const syncDatabase = (forceSync: boolean) => {
	return new Promise((resolve) => {
		dbAuthenticate()
			.then(() => {
				sequelize
					.sync({ force: forceSync })
					.then(async () => {
						console.log('                 mySQL Database: \x1b[92mSyncronized\x1b[0m');
						resolve(true);
					})
					.catch((e) => console.log('Unable to Sync: \x1b[31m', e, '\x1b[0m'));
			})
			.catch((e) => console.log('Unable to Authenticate: \x1b[31m', e, '\x1b[0m'));
	});
};

const seedDefault = async (): Promise<boolean> => {
	const systemUser = User.build({
		fName: 'Martin',
		lName: 'Mendez',
		email: 'martin.mendez@bmanagerpro.com',
		password: 'system',
		isRoleSystem: true
	});
	systemUser.addUserId = systemUser.id;
	try {
		await systemUser.save();
	} catch (err) {
		console.log(err);
	}

	const config = Config.build({
		businessName: 'BluCon',
		domain: 'blucon',
		city: 'Torreon',
		state: 'Coahula',
		zipCode: '27019',
		addUserId: systemUser.id
	});
	try {
		await config.save();
	} catch (err) {
		console.log(err);
	}

	await seedCurrencies();

	return true;
};

const database = { init };
export default database;
