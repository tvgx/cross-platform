const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'wasm' to asset extensions
config.resolver.assetExts.push('wasm');

// Mock react-native-fetch-blob and Node.js core modules for alasql
const nodeMocks = new Set([
  'fs',
  'path',
  'os',
  'crypto',
  'stream',
  'net',
  'tls',
  'child_process',
  'dns',
  'http',
  'https',
  'zlib',
  'readline',
  'cpexcel'
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-fetch-blob' || nodeMocks.has(moduleName)) {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
