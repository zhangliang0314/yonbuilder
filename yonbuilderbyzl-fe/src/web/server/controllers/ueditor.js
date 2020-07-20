import { doFetch } from './common'
import env from '../env'
import { combine } from '@mdf/cube/lib/helpers/util'

var fs = require('fs');
var path = require('path');
var request = require('request')

let defaultConfig = null;
fs.readFile(path.join(process.cwd(), 'static/ueditor/nodejs/config.json'), 'utf8', function (err, result) {
  try {
    // eslint-disable-next-line no-eval
    defaultConfig = eval('(' + result + ')');
  } catch (e) {
    defaultConfig = {};
  }
})

const newUpload = function (ctx) {
  return new Promise(function (resolve, reject) {
    const serviceUrl = env.HTTP_USER_UPLOAD + '?token=' + ctx.token;
    const { req } = ctx;
    req.pipe(request(serviceUrl, function (err, response, body) {
      const json = JSON.parse(body);
      if (!err) {
        resolve({ url: json.data, state: 'SUCCESS' });
      } else {
        reject(err);
      }
    }))
  });
};

const batch = function (ctx, static_url, dir_url) {
  return new Promise(function (resolve, reject) {
    var i = 0;
    var list = [];
    fs.readdir(static_url + dir_url, function (err, files) {
      if (err) throw err;

      var total = files.length;
      files.forEach(function (file) {
        var filetype = 'jpg,png,gif,ico,bmp';
        var tmplist = file.split('.');
        var _filetype = tmplist[tmplist.length - 1];
        if (filetype.indexOf(_filetype.toLowerCase()) >= 0) {
          var temp = {};
          // eslint-disable-next-line no-undef
          if (list_dir === '/') {
            // eslint-disable-next-line no-undef
            temp.url = list_dir + file;
          } else {
            // eslint-disable-next-line no-undef
            temp.url = list_dir + '/' + file;
          }
          list[i] = (temp);
        } else { }
        i++;
        // send file name string when all files was processed
        if (i === total) {
          resolve({
            state: 'SUCCESS',
            list: list,
            start: 1,
            total: total
          });
        }
      });
    });
  });
}
const ueditorController = {
  basictest: function (ctx) {
    ctx.render({
      title: '富文本编辑器'
    });
  },
  ue: async function (ctx) {
    const { token } = ctx;
    const actionType = ctx.request.query.action;
    if (actionType === 'uploadimage' || actionType === 'uploadfile' || actionType === 'uploadvideo') {
      ctx.body = await newUpload(ctx);
    } else if (actionType === 'listimage') {
      var static_url = path.join(process.cwd(), 'public');
      var dir_url = '/images/ueditor/';
      ctx.body = await batch(ctx, static_url, dir_url);
    } else {
      // ctx.redirect('/ueditor/nodejs/config.json');
      const serviceUrl = combine(env.HTTP_SERVICE_BASEURL, `pub/fileupload/getFileServerUrl?token=${token}`);
      const json = await doFetch(serviceUrl);
      const config = Object.assign({}, defaultConfig);
      if (json.code === 200 && json.data)
        config.imageUrlPrefix = json.data;
      ctx.body = config;
    }
  }
}
module.exports = ueditorController
export default function (router) {

}
