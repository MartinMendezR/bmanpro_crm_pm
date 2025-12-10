import Currency from '../models/currency';

let currencies: Currency[] = [];

export const updateRates = (): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		Currency.findAll()
			.then((res) => {
				currencies = res;
				resolve(true);
			})
			.catch(() => reject(false));
	});
};

const exchange = (amount: number, from: string, to: string): { value?: number; err?: string } => {
	if (from === to) return { value: amount };

	if (currencies.length === 0) return { err: 'There is not currencies' };

	const rateFrom = currencies.find((f) => f.code === from)?.rate ?? -1;

	if (rateFrom === -1) return { err: `'${from}' is notFound` };

	const rateTo = currencies.find((f) => f.code === to)?.rate ?? -1;

	if (rateTo === -1) return { err: `'${to}' is notFound` };

	const value = amount * (rateTo / rateFrom);
	return { value };
};

export default exchange;
