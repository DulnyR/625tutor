const withTM = require('next-transpile-modules')(['pdfjs-dist']);

module.exports = withTM({
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /pdf\.worker\.js$/,
        use: { loader: 'worker-loader', options: { esModule: false, filename: '[name].[contenthash].js' } },
      });
    }
    return config;
  },
});