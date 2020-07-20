//修改从getEnv获取.为了适应打包.
export default {

  domainCode: 'AM', // 打印需要的域code值
  HTTP_USER_LOGIN: '/user/authorize',
  USER_LOGIN_PARAMS: {
    username: 'u8c_vip@163.com',
    password: '123456',
  },
  AUTH_WHITELIST: ['/demo', '/menu'],

  HTTP_CONTENT_TYPE: {
    //JSON: 'application/json',
  },
  IS_REDIRECT_LOGIN: true,
  USESTATERULE: true, // true-代表启用staterule
  USEFORMULARULE: true, // true-代表启用formularule
  appCode: 'mdf-runtime',
  REQUEST_TPLLIST: false // 优化tillist接口，新增不再调用tpllist接口
}
