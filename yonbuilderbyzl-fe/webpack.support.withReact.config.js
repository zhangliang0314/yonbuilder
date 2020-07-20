var path = require('path');
var webpack = require('webpack');
var moment = require('moment')
var HTMLWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const autoprefixer = require('autoprefixer')
var GenerateAssetPlugin = require('generate-asset-webpack-plugin');
var version = require('uuid')();
const webpackConfig = require('./webpack.config')
var origin = [
  path.resolve('src/business'),
  path.resolve('node_modules/@mdf'),
  path.resolve('node_modules/yonui-ys')
];
// let extractCSS = new ExtractTextPlugin('styles/default/[name].min.css')
const cssPath = 'styles/default/[name].min.css';
const cssChunkFilename = 'styles/default/[name].[contenthash].min.css';
var nowDateStr = moment().format("YYYY-MM-DD HH:mm:ss")

var config = {
  // entry: {
  //   'yxyweb-support-withReact': './node_modules/@yonyou/mdf-refer/lib/index.js',
  // },
  entry: { 'yxyweb-support-withReact': './mdfrefer.js' },
  mode: 'production',
  output: {
    //comments: false,
    publicPath: '../../',
    path: path.join(__dirname, 'static'),
    filename: 'public/javascripts/[name].min.js',
    chunkFilename: 'public/javascripts/[name].[contenthash].min.js'
  },
  resolve: {
    alias: {
      'react': path.join(__dirname, 'node_modules', 'react'),
      'business':webpackConfig.resolve.alias.business || './src/business'
    },
    extensions: [".js", ".jsx"],
  },
  module: {
    //root: origin,
    //modulesDirectories: ['node_modules'],
    rules: [{
      test: /\.(js|jsx)$/,
      loader: 'babel-loader',
      options: {
        plugins: [
          'dynamic-import-webpack',
          'remove-webpack'
        ]
      },
      include: origin,
      // query: {
      //   plugins: [
      //     ["import", { "style": "css", "libraryName": "antd" }]
      //   ],
      //   cacheDirectory: true
      // }
    }, {
      test: /\.(map)$/,
      loader: 'ignore-map-loader',
      include: origin,
    },{
      test: /\.(jpg|png|gif|ico)$/,
      loader: 'url-loader',
      options: {
        limit: 8192,
        name: 'styles/default/images/[hash:8].[name].[ext]'
      },
      include: origin,
    }, {
      test: /\.less$/,
      use: [{
        loader: MiniCssExtractPlugin.loader,
      }, {
        loader: 'css-loader',
        options: {
          importLoaders: 2,
        },
      }, {
        loader: 'postcss-loader',
        options: {
          ident: 'postcss',
          plugins: [
            autoprefixer()
          ]
        }
      }, {
        loader: 'less-loader'
      }]
    }, {
      test: /\.css$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader
        },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 2
          },
        }, {
          loader: 'postcss-loader',
          options: {
            ident: 'postcss',
            plugins: [
              autoprefixer()
            ]
          }
        }]
    }, {
      test: /\.(woff|svg|eot|ttf)\??.*$/,
      loader: 'url-loader',
      options: {
        name: 'fonts/[name].[md5:hash:hex:7].[ext]'
      },
    }]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
      'process.env.__LANG__': process.env.MDF_LANG,
      'process.env.__CLIENT__': 'true'
    }),
    new OptimizeCSSAssetsPlugin({
      cssProcessorOptions: {
        safe: true,
        mergeLonghand: false,
        discardComments: { removeAll: true }
      },
      canPrint: true
    }),
    new webpack.BannerPlugin(`基础服务\nupdate: ${nowDateStr}`),
    new MiniCssExtractPlugin({
      filename: cssPath,
      chunkFilename: cssChunkFilename,
      ignoreOrder: false, // Enable to remove warnings about conflicting order
    }),
  ],
  devtool: 'source-map',
};

module.exports = config;
