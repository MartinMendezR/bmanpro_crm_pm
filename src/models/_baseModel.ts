import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, NonAttribute } from 'sequelize';
import User from './user'; // adjust path as needed

// Base model for reusable audit + status fields
export abstract class BaseModel<TAttributes extends {} = {}, TCreationAttributes extends {} = {}> extends Model<
	TAttributes & InferAttributes<BaseModel>,
	TCreationAttributes & InferCreationAttributes<BaseModel>
> {
	// Status flags
	declare active: CreationOptional<boolean>;

	// Audit fields
	declare addDate: CreationOptional<Date>;
	declare addUserId: CreationOptional<ForeignKey<string>>;
	declare addUser?: NonAttribute<User>;

	declare delDate: CreationOptional<Date | null>;
	declare delUserId: CreationOptional<ForeignKey<string | null>>;
	declare delUser?: NonAttribute<User>;
}
