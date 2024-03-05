
const camelCaseToWords = (s) => {
    const result = s.replace(/([A-Z])/g, ' $1')?.trim();
    return result.charAt(0).toUpperCase() + result.slice(1);
};

const removeExtension = (s) => {
    const splitRes = s.split('.');
    splitRes.pop();
    return splitRes.join('.');
}

const getExtension = (s) => {
    const splitRes = s.split('.');
    return splitRes.pop();
}


module.exports = {
    camelCaseToWords,
    removeExtension,
    getExtension
}