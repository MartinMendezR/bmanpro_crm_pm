import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import sequelize from '@/lib/sequelize';

class Currency extends Model<InferAttributes<Currency>, InferCreationAttributes<Currency>> {
	declare code: string;
	declare selected: boolean;
	declare rate: number;
	declare symbol: string;
	declare name: string;
	declare symbolNative: string;
	declare decimalDigits: number;
	declare rounding: number;
	// Timestamp
	declare date: CreationOptional<Date>;
}

Currency.init(
	{
		code: { type: DataTypes.STRING(5), primaryKey: true },
		selected: { type: DataTypes.BOOLEAN, defaultValue: false },
		rate: { type: DataTypes.DECIMAL(18, 8), defaultValue: 0 },
		symbol: { type: DataTypes.STRING(5) },
		name: { type: DataTypes.STRING(255) },
		symbolNative: { type: DataTypes.STRING(50) },
		decimalDigits: { type: DataTypes.SMALLINT },
		rounding: { type: DataTypes.SMALLINT },
		date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
	},
	{
		sequelize,
		modelName: 'currency',
		timestamps: false,
		scopes: {
			short: () => ({
				attributes: ['code', 'rate', 'name']
			})
		}
	}
);

export default Currency;
