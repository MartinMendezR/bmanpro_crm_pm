import util from 'util';
import { loremIpsum } from 'lorem-ipsum';

export const trimProperties = (objectToTrim: object) => {
	const obj: any = {};
	Object.entries(objectToTrim).forEach(
		([key, value]) => (obj[key] = typeof value === 'string' ? value.trim() : value)
	);
	return obj;
};

export const removeBlankSpaces = (field: string) => {
	return field.trim().replace(' ', '');
};

/**
 * Process the username string provided by user to ensure correct format
 * Eliminates blankspaces, numbers and punctuations
 * @param username string provided by client user
 * @returns the username with right format
 */
export const usernamedIt = (field: string) => {
	return field.toString().replace(/[^a-zA-Z]/g, '');
};

export const longString = (length: number) => {
	let c = '';
	let response = '';
	let toLower: boolean;
	let rnd: number;

	for (let i = 0; i < length; i++) {
		//  ASCII 65 to 90  = [ A, Z ]
		rnd = Math.floor(Math.random() * (90 - 65 + 1)) + 65; // uppercase leter ascii code
		toLower = Math.random() > 0.5; // 50% to lowercase

		c = String.fromCharCode(rnd); //  convert from number ascii code to char

		if (toLower) c.toLocaleLowerCase();

		response += c;
	}
	return response;
};

export const lorem = (paragraphs: number, sentencesPerParagraph: number, wordPerSentences: number) => {
	const response = loremIpsum({
		count: paragraphs,
		paragraphLowerBound: sentencesPerParagraph, // Min. number of sentences per paragraph.
		paragraphUpperBound: sentencesPerParagraph + 2, // Max. number of sentences per paragarph.
		sentenceLowerBound: wordPerSentences, // Min. number of words per sentence.
		sentenceUpperBound: wordPerSentences + 5, // Max. number of words per sentence.
		units: 'paragraphs',
		suffix: '\n\n'
	});

	return response;
};

export const inspect = (obj: any) => {
	console.log(util.inspect(obj, { showHidden: false, depth: null, colors: true }));
};
