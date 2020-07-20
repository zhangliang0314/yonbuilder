/*
* 全局配置的环境变量
*
* @param HTTP_SERVICE_BASEURL
* 请求的后台地址，需要配置
* 根据工程环境配置不通变量
*
* @param HTTP_PRINT_SERVER
* 打印地址，需配置
*
* @param HTTP_SERVER_PORT
* node 服务端口号
*
* @param HTTP_USER_LOGIN
* 用户登陆接口，用于前端调试，获取token，需要配置
*
* @param USER_LOGIN_PARAMS
* 配置登陆的参数，用于前端调试，获取token，需要配置
*
* @param AUTH_WHITELIST
* 不做token校验的白名单，接口，页面等，需要配置
*
* @param HTTP_CONTENT_TYPE
* 接口请求的content-type类型，可扩展，内置 XLS JSON PDF FORM
*
*
* @param IS_REDIRECT_LOGIN
* BOOLEAN token失效是否重定向登陆页
* */

/* 根据不通的环境，配置地址 */
let base_url = '';
let workflow_url = ''; // 审批url
let print_url = '';
const config_env = process.env.SERVER_ENV;
switch (config_env) {
  case '':
    base_url = 'https://uretailserver.yonyoucloud.com/uretail';
    print_url = 'http://uretailserver.yonyouup.com/print_service ';
    workflow_url = 'https://yb.diwork.com';
    break;
  case 'daily':
    base_url = 'https://uretailserver.yonyoucloud.com/uretail';
    print_url = 'http://uretailserver.yonyouup.com/print_service';
    workflow_url = 'http://yb91.yyuap.com:91';
    break;
  default:
    base_url = 'https://uretailserver.yonyoucloud.com/uretail';
    print_url = 'http://uretailserver.yonyouup.com/print_service';
    workflow_url = 'http://yb91.yyuap.com:91';
}
export default {
  HTTP_SERVICE_BASEURL: base_url,
  HTTP_PRINT_SERVER: print_url,
  HTTP_SERVER_PORT: 3003,
  HTTP_WORKFLOW_SERVER: workflow_url,
  HTTP_USER_LOGIN: '/user/authorize',
  USER_LOGIN_PARAMS: {
    username: 'u8c_vip@163.com',
    password: '123456',
  },
  AUTH_WHITELIST: ['/demo', '/menu'],

  HTTP_CONTENT_TYPE: {
    // JSON: 'application/json',
  },
  IS_REDIRECT_LOGIN: true,
  excludeToken: false
}
