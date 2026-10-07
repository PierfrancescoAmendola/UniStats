// Same preset Metro uses by default; spelled out so Jest transforms the app the same way
module.exports = function (api) {
    api.cache(true);
    return { presets: ['babel-preset-expo'] };
};
