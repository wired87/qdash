const path = require('path');

module.exports = {
  webpack: {
    configure: (config) => {
      // Alias @heroui/dom-animation to our shim so it is bundled in the main chunk.
      // HeroUI uses dynamic import("@heroui/dom-animation"), which CRA code-splits
      // into a chunk that can 404 (ChunkLoadError). The shim is eagerly imported
      // in src/index.tsx, so it lives in the main bundle and the dynamic import
      // resolves to the same module.
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        '@heroui/dom-animation': path.resolve(__dirname, 'src/heroui-dom-animation-shim.js'),
      };
      return config;
    },
  },
};
