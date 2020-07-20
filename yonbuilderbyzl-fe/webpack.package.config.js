var path = require('path');
var webpack = require('webpack');
var moment = require('moment')
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HTMLWebpackPlugin = require('html-webpack-plugin')
var GenerateAssetPlugin = require('generate-asset-webpack-plugin');
var version = require('uuid')();
// var origin = [
//   path.resolve('src/common'),
//   path.resolve('src/client'),
// ];
var origin = [
  path.resolve('src/common'),
  path.resolve('src/client'),
  path.resolve('node_modules/@mdf'),
];
let extractCSS = new ExtractTextPlugin('styles/default/[name].min.css')
var nowDateStr = moment().format("YYYY-MM-DD HH:mm:ss")

var config = {
  entry: {
    'main': './src/client/index.jsx'
  },
  output: {
    //comments: false,
    publicPath: '../../',
    path: path.join(__dirname, 'static'),
    filename: 'scripts/[name].min.js'
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    //root: origin,
    //modulesDirectories: ['node_modules'],
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        include: origin,
        query: {
          plugins: [["import", { "style": "css", "libraryName": "antd" }]],
          cacheDirectory: true
        }
      }, {
        test: /\.(jpg|png|gif|ico)$/,
        loader: 'url-loader',
        options: {
          limit: 8192,
          name: 'styles/default/images/[hash:8].[name].[ext]'
        },
        include: [
          origin,
          path.resolve('node_modules/u8c-components/dist'),
        ]
      }, {
        test: /\.less$/,
        loader: extractCSS.extract({
          fallback: 'style-loader',
          use: [

            {
              loader: 'css-loader',
              options: {
                minimize: {
                  autoprefixer: {
                    add: true,
                    remove: true,
                    browsers: ['last 2 versions'],
                  },
                },
              },
            },

            {
              loader: 'less-loader',

            },

          ],
        }),
      }, {
        test: /\.css$/,
        loader: extractCSS.extract({
          fallback: 'style-loader',
          use: [

            {
              loader: 'css-loader',
              options: {
                minimize: {
                  autoprefixer: {
                    add: true,
                    remove: true,
                    browsers: ['last 2 versions'],
                  },
                },
              },
            }

          ],
        }),
      }, {
        test: /\.(woff|svg|eot|ttf)\??.*$/,
        loader: 'url-loader',
        options: {
          name: 'fonts/[name].[md5:hash:hex:7].[ext]'
        },
        //loader: 'url-loader?name=fonts/[name].[md5:hash:hex:7].[ext]',
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
      'process.env.__CLIENT__': 'true',
      'process.env.__TOUCH__': JSON.stringify(version)
    }),
    // webpack3已经移除DedupePlugin和默认设置OccurenceOrderPlugin[https://webpack.js.org/guides/migrating/]
    //new webpack.optimize.DedupePlugin(),
    //new webpack.optimize.OccurenceOrderPlugin(),

    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: true,
    //   output: {
    //     comments: false,
    //   },
    //   compress: {
    //     warnings: false
    //   }
    // }),

    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('./manifest.production.json')
    }),
    new webpack.BannerPlugin(`U零售\nupdate: ${nowDateStr}`),
    extractCSS

  ].concat(process.env.PACKAGE_TEMP ? [] : [
    new GenerateAssetPlugin({
      filename: '../bin/package.version.json',
      fn: (compilation, cb) => {
        cb(null, JSON.stringify({ version: version }, null, '\t'));
      },
      extraFiles: []
    })
  ]),
  devtool: 'source-map',
};

module.exports = config;
