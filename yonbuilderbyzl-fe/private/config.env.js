/*
* 全局配置的环境变量
*
* @param HTTP_SERVICE_BASEURL
* 请求的后台地址，需要配置
* 根据工程环境配置不通变量
*
* 打印地址，需配置（具体需要跟打印对接，当前不同环境下的地址如下：pre：http://print-y3me-pre.diwork.com，daily：https://u8cprint-daily.yyuap.com，test：http://u8cprint.test.app.yyuap.com）
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

/*根据不通的环境，配置地址*/
/*根据不通的环境，配置地址*/
let base_url='', // 领域接口地址
    workflow_url = '', //审批url
    tpl_url='', // 统一UI元数据服务
	  print_url='',
	  old_uitemplate_url = '', // 人力老服务接口地址
	  customize_button_url = ''; // 自定义按钮页面接口地址
let file_url=''
const config_env=process.env.SERVER_ENV;
switch (config_env) {//根据当前环境类型定义不同变量值
  // case '':
  //   base_url= 'developplatform.daily.app.yyuap.com:8080';
  //   print_url="https://u8cprint-daily.yyuap.com";
  //   workflow_url = 'https://yb.diwork.com';
  //   break;
  // default:
  //   base_url='developplatform.daily.app.yyuap.com:8080';
  //   print_url="http://u8cprint-daily.yyuap.com";
  //   workflow_url = 'http://yb91.yyuap.com:91';
  //   tpl_url = 'https://u8cms-daily.yyuap.com/mdf';


    case 'iteration':
		base_url='http://yonsuite-iter.yyuap.com';
		print_url="http://uretailserver.yonyouup.com/print_service"; //打印接口模版管理无用，所有环境都先写一个地址
		workflow_url = 'https://yb-u8c-daily.yyuap.com';//
		old_uitemplate_url = "http://yonsuite-iter.yyuap.com";
		customize_button_url = "http://hpapaas-passport-be.daily.app.yyuap.com" // 自定义按钮页面接口
		// design_url ="http://u8cdesign.test.app.yyuap.com";//新版设计器接口地址
		// OLD_DESIGN_BASEURL = "http://workbench.yyuap.com";//旧版版设计器接口地址
		break;
	case 'test':
		base_url='http://developplatform.test.app.yyuap.com';
        tpl_url='http://u8c-test.yyuap.com/mdf';
		print_url="http://uretailserver.yonyouup.com/print_service"; //打印接口模版管理无用，所有环境都先写一个地址
		workflow_url = 'https://yb-u8c-daily.yyuap.com';//
		old_uitemplate_url = "http://u8c-test.yyuap.com";
		customize_button_url = "http://hpapaas-passport-be.test.app.yyuap.com" // 自定义按钮页面接口
		// design_url ="http://u8cdesign.test.app.yyuap.com";//新版设计器接口地址
		// OLD_DESIGN_BASEURL = "http://workbench.yyuap.com";//旧版版设计器接口地址
		break;
	case 'daily':
		base_url='https://build-daily.yyuap.com';
		tpl_url = 'https://u8cms-daily.yyuap.com/mdf';
		// print_url="http://uretailserver.yonyouup.com/print_service";
    print_url="http://u8cprint-daily.yyuap.com/u8cprint";
		workflow_url = 'https://yb-u8c-daily.yyuap.com';
		old_uitemplate_url = "https://u8cms-daily.yyuap.com";
		customize_button_url = "https://build-daily.yyuap.com" // 自定义按钮页面接口
		// design_url ="http://u8cdesign.daily.app.yyuap.com";//新版设计器接口地址
		// OLD_DESIGN_BASEURL = "https://u8cms-daily.yyuap.com";//旧版版设计器接口地址
		break;
	case 'pre':
		base_url='https://ms-y3me-pre.diwork.com';
		print_url="http://uretailserver.yonyouup.com/print_service";
		workflow_url = 'https://yb-u8c-daily.yyuap.com';
		old_uitemplate_url = "https://ms-y3me-pre.diwork.com";
		customize_button_url = "http://hpapaas-passport-be.daily.app.yyuap.com" // 自定义按钮页面接口
		// design_url ="http://design-y3me-pre.app.yyuap.com";//新版设计器接口地址
		// OLD_DESIGN_BASEURL = "https://ms-y3me-pre.diwork.com";//旧版版设计器接口地址
		break;
	case 'release':
		base_url='http://developplatform.test.app.yyuap.com';
		print_url="http://uretailserver.yonyouup.com/print_service";
		workflow_url = 'https://yb-u8c-daily.yyuap.com';
		old_uitemplate_url = "https://ms.diwork.com";
		customize_button_url = "http://hpapaas-passport-be.daily.app.yyuap.com" // 自定义按钮页面接口
		// design_url ="http://design-yonsuite.app.yyuap.com";//新版设计器接口地址
		// OLD_DESIGN_BASEURL = "https://ms.diwork.com";//旧版版设计器接口地址
		break;
	default:// 目前将默认的地址改为测试环境的
		base_url='http://developplatform.daily.app.yyuap.com';
// 		print_url="http://uretailserver.yonyouup.com/print_service";
    print_url=base_url;// 暂采用此方式打到后端
    workflow_url = 'https://yb-u8c-daily.yyuap.com';
		old_uitemplate_url = "http://workbench.yyuap.com";
		customize_button_url = "http://hpapaas-passport-be.daily.app.yyuap.com" // 自定义按钮页面接口
		tpl_url = 'https://u8cms-daily.yyuap.com/mdf';
		// design_url ="http://u8cdesign.test.app.yyuap.com";//新版设计器接口地址
    file_url = "https://ezone-u8c-daily.yyuap.com";// 文件存储地址
	}

/**因为plugin-metat中添加参照不走缓存配置，需要verson.json 。测试没问题可以将sever/env/index.js中的version覆盖 */
let version;
if (process.env.NODE_ENV === 'production') {
  try {
    version = require('../../../bin/version.json').version;//修改取到verson路径的问题
  } catch (e) {
    version = '';
  }
}

export default {
  STATIC_RANDOM_SUFFIX: version,
  HTTP_SERVICE_BASEURL: base_url,
  HTTP_TPL_SERVER_URL: tpl_url,
  HTTP_OLD_UITEMPLATE_URL:old_uitemplate_url,
  HTTP_CUSROMIZE_BUTTON_URL:customize_button_url,
  HTTP_PRINT_DATA_SERVERURL:base_url ,//服务器请求业务数据接口
  HTTP_PRINT_SERVER:print_url,
  HTTP_WORKFLOW_SERVER:workflow_url,
  HTTP_FILE_SERVER:file_url,
  domainCode:'AM',//打印需要的域code值
  HTTP_USER_LOGIN: '/user/authorize',
  USER_LOGIN_PARAMS:{
    username : 'u8c_vip@163.com',
    password :'123456',
  },
  AUTH_WHITELIST:['/demo','/menu'],

  HTTP_CONTENT_TYPE:{
    //JSON: 'application/json',
  },
  IS_REDIRECT_LOGIN:true,
  // 模版管理使用
//   DESIGN_BASEURL:design_url,//新版设计器接口地址
//   OLD_DESIGN_BASEURL:base_url,//新版设计器接口地址

  USESTATERULE: true,   //true 代表启用staterule
  USEFORMULARULE: true,   //true 代表启用formularule
}











