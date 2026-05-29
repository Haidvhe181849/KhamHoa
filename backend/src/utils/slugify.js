const slugify = require('slugify');

exports.createSlug = (text) => {
    return slugify(text, {
        lower: true,
        strict: true,
        locale: 'vi'
    });
};
