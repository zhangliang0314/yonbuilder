const path = require('path');
const webpack = require('webpack')
const HappyPack = require('happypack');
const happyThreadPool = HappyPack.ThreadPool({
    size: 4
});
const autoprefixer = require('autoprefixer')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const origin = [path.resolve('node_modules/@mdf'), path.resolve('src'), ];

const globalCssDir = [
  path.resolve('src/mobile/common/styles/globalCss'),
  path.resolve('src/web')

]

const _externals = require('externals-dependencies')

module.exports = {
    entry: {
        bin: [
        './src/web/server/index.js',
        ]
    },
    output: {
        path: path.resolve(__dirname),
        filename: '[name].js'
    },
    resolve: {
        extensions: [".js", ".jsx"]
    },
    target: 'node',
    externals: _externals(),
    context: __dirname,
    node: {
        console: true,
        global: true,
        process: true,
        Buffer: true,
        __filename: true,
        __dirname: true,
        setImmediate: true,
        path: true
    },
    externals: ['meta-touch','vertx','canvas'],

    module: {
        rules: [{
            test: /\.(js|jsx)$/,
            include: origin,
            exclude: /node_modules/,
            use: ['happypack/loader?id=happyBabel', 'webpack-conditional-loader']
        },
        {
            test: /\.less$/,
            exclude: globalCssDir,
            use: [{
                loader: 'style-loader',
                options: {
                    hmr: false
                },
            },
            {
                loader: 'css-loader',
                options: {
                    modules: true,
                    importLoaders: 2,
                    sourceMap: false
                },
            }]
        } ,{
          test: /\.less$/,
          include: globalCssDir,
          use: [{
            loader:   'style-loader',
            options: {
              hmr: false
            },
          }, {
            loader: 'css-loader',
            options: {
              modules: false,
              importLoaders: 2,
              sourceMap: false
            },
          }, {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              sourceMap: false,
              plugins: [
                autoprefixer()
              ]
            }
          }, {
            loader: 'less-loader',
            options: {
              sourceMap: false
            }
          }]
        },
        {
            test: /\.css$/,
            exclude: globalCssDir,
            use: [{
                loader: 'style-loader',
                options: {
                    hmr: false
                },
            },
            {
                loader: 'css-loader',
                options: {
                    modules: true,
                    importLoaders: 2,
                    sourceMap: false
                },
            },
            {
                loader: 'postcss-loader',
                options: {
                    ident: 'postcss',
                    sourceMap: false,
                    plugins: [autoprefixer()]
                }
            }]
        }

        ]
    },
    plugins: [new HappyPack({
        id: 'happyBabel',
        loaders: [{
            loader: 'babel-loader?cacheDirectory=true',
        }],
        threadPool: happyThreadPool,
        verbose: true,
    })]
}
