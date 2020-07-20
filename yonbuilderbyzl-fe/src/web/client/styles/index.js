// comments used by webpack-conditional-loader, do not remove
// import '@mdf/theme/theme-default/index';//勿删 @mdf/theme-default 中将这个删了。

if(process.env.__THEMETYPE__ === 'ncc') {
  require('./ncc.less')
}
else{
  require('./ys.less')
}
