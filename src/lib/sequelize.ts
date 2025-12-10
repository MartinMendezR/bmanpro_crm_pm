import { Sequelize, Options } from 'sequelize';

export const getDatabaseName = (): string => {
	let suffix = '';

	if (process.env.NODE_ENV === 'development') suffix = '_development';
	else if (process.env.NODE_ENV === 'test') suffix = '_test';

	const dbName = process.env.DB_NAME + suffix;
	return dbName;
};

const loggingEnabled = false;
const options: Options = {
	database: getDatabaseName(),
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,

	host: process.env.DB_HOST,
	dialect: 'mysql',
	dialectOptions: {},
	logging: loggingEnabled
		? (msg) => {
				console.log(msg);
			}
		: false
};

const sequelize = new Sequelize(options);

export default sequelize;
