const removeSpecialCharacters = require('./remove-special-characters');

const accents = 'ÀÁÂÃÄÅàáâãäåßÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
const accentsOut = 'AAAAAAaaaaaaBOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz';

/**
 * 
 * @param {string} firstName 
 * @param {string} lastName
 * @returns {string}
 */
module.exports = function (firstName, lastName) {
	const str = removeSpecialCharacters(firstName.charAt(0) + lastName.split(' ')[0]).toLocaleLowerCase();
	const arr = str.split('');
	let x = 0;

	for (let i = 0; i < arr.length; i++) {
		if ((x = accents.indexOf(arr[i])) != -1) {
			arr[i] = accentsOut[x];
		}
	}

	return arr.join('');
}