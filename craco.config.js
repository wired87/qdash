const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

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

      if (isProd) {
        // Strip console.log/debug/info calls in production; keep warn/error
        config.optimization = config.optimization || {};
        config.optimization.minimizer = [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: false,
                pure_funcs: ['console.log', 'console.debug', 'console.info'],
              },
            },
          }),
        ];

        // Granular chunk splitting: vendor libs in separate long-lived cache chunks
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-redux|redux|@reduxjs)[\\/]/,
              name: 'vendor-react',
              chunks: 'all',
              priority: 40,
              enforce: true,
            },
            three: {
              test: /[\\/]node_modules[\\/](three)[\\/]/,
              name: 'vendor-three',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            heroui: {
              test: /[\\/]node_modules[\\/](@heroui|framer-motion)[\\/]/,
              name: 'vendor-heroui',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 10,
            },
          },
        };
      }

      return config;
    },
  },
};
