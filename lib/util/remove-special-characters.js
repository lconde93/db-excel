
/**
 * 
 * @param {string} arg
 * @returns {string}
 */
module.exports = function(arg) {
    const regExpr = /[^a-zA-Z0-9]/g;

    return arg.replace(regExpr, '');
}