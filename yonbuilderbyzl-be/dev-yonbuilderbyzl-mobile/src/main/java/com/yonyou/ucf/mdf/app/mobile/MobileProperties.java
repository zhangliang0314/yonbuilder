package com.yonyou.ucf.mdf.app.mobile;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mdf.mobile")
@Data
public class MobileProperties {

    /**
     * 解密空间yhtToken的私钥
     */
    private String yhtTokenPrivateKey;

    /**
     * 移动端允许跨域的域名后缀
     */
    private String[] crossDomainWhitelist = {"yyuap.com", "diwork.com", "yonyoucloud.com", "yonyou.com"};

    /**
     * 请求移动端菜单列表的域名
     */
    private String appMenuListHost;


}
