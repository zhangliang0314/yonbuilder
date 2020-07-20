/*
 * 全局配置的环境变量
 * 请到根目录env.json中修改
 * 请到根目录env.json中修改
 * 请到根目录env.json中修改
 * 请到根目录env.json中修改
 * 请到根目录env.json中修改
 * 请到根目录env.json中修改
 * 请到根目录env.json中修改
 * 请到根目录env.json中修改
 * 请到根目录env.json中修改
 * */
import dftConfig from './config'

let getMDFEnvConfig = function () {
  if (global.currentEnvConfig) {
    return global.currentEnvConfig;
  } else {
    var fs = require("fs")
    let config_env = process.env.SERVER_ENV;
    let envJsonFile = process.cwd() + "/env.json";
    if (fs.existsSync(envJsonFile)) {
      var envStr = fs.readFileSync(envJsonFile);
      var envData = JSON.parse(envStr);
      if (!config_env) {
        config_env = "default"
      }
      var currentEnvConfig = envData[config_env];
      currentEnvConfig.config_env = config_env;
      currentEnvConfig.version = process.hrtime();
      global.currentEnvConfig = currentEnvConfig;
      return currentEnvConfig;
    }else{
      throw new Error("全局配置文件不存在,请检查:" + envJsonFile)
    }
  }
}



//修改从getEnv获取.为了适应打包.

let cfgEnv = Object.assign({}, dftConfig, {
  STATIC_RANDOM_SUFFIX: getMDFEnvConfig().version,
  HTTP_SERVICE_BASEURL: getMDFEnvConfig().base_url,
  HTTP_TPL_SERVER_URL: getMDFEnvConfig().tpl_url,
  HTTP_REPORT_SERVER_URL: getMDFEnvConfig().report_url,
  HTTP_CUSROMIZE_BUTTON_URL: getMDFEnvConfig().customize_button_url,
  HTTP_PRINT_DATA_SERVERURL: getMDFEnvConfig().base_url, // 服务器请求业务数据接口
  HTTP_PRINT_SERVER: getMDFEnvConfig().print_url,
  HTTP_WORKFLOW_SERVER: getMDFEnvConfig().workflow_url,
  HTTP_FILE_SERVER: getMDFEnvConfig().file_url,
  SERVER_ENV: getMDFEnvConfig().config_env,
  COOPERATION_URL:getMDFEnvConfig().cooperation_url
});

export default cfgEnv;
