module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react'
  ],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          src: process.env.MDF_TARGET === 'mobile' ? './src/mobile' : './src/web',
          web: './src/web',
          client: './src/client',
          business: './src/business',
          static: './static'
          // "SvgIcon": "./node_modules/@mdf/metaui-web/lib/components/common/SvgIcon.js"
        }
      }
    ],
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-import-meta',
    'transform-es2015-modules-commonjs',
    [
      '@babel/plugin-proposal-decorators',
      {
        legacy: true
      }
    ],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-json-strings',
    '@babel/plugin-proposal-function-sent',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-numeric-separator',
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-logical-assignment-operators',
    '@babel/plugin-proposal-optional-chaining',
    [
      '@babel/plugin-proposal-pipeline-operator',
      {
        proposal: 'minimal'
      }
    ],
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-do-expressions'
  ],
  env: {
    development: {
      plugins: [ 'react-hot-loader/babel' ]
    }
  }
}
