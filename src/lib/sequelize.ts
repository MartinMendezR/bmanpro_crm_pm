import { Sequelize, Options } from 'sequelize';

export const getDatabaseName = (): string => {
	let prefix = '';

	if (process.env.NODE_ENV === 'development') prefix = 'development_';
	else if (process.env.NODE_ENV === 'test') prefix = 'test';

	const dbName = prefix + process.env.MYSQL_DATABASE;
	return dbName;
};

const loggingEnabled = false;
const options: Options = {
	database: getDatabaseName(),
	username: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,

	host: process.env.MYSQL_HOST,
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
