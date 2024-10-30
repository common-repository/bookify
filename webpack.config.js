const defaults = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
  ...defaults,
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  entry: {
      admin: './src/admin/index.js',
      frontend: './src/frontend/index.js',
      appointments: './src/appointments/index.js'
  },
  output: {
      path: path.resolve(__dirname, 'build'),
      filename: '[name].bundle.js',
  },
};
