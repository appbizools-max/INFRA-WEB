const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add the '.woff' format to the list of assets that Metro knows how to bundle
config.resolver.assetExts.push('woff', 'woff2');

module.exports = config;
