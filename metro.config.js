const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'wasm' to asset extensions
config.resolver.assetExts.push('wasm');

// Mock react-native-fetch-blob for alasql
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-fetch-blob') {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
