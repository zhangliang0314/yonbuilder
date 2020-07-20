package com.yonyou.ucf.mdf;

import com.yonyou.cloud.inotify.client.NotifyStub;
import com.yonyou.cloud.middleware.rpc.RPCBeanFactory;
import com.yonyou.cloud.middleware.rpc.SpringExecuteTartgetLoader;
import com.yonyou.cloud.yonscript.filter.J2v8DebugHelperFilter;
import com.yonyou.diwork.config.DiworkEnv;
import com.yonyou.iuap.print.client.servlet.PrintDelegateServlet;
import com.yonyou.iuap.ucf.log.filter.MDCLogFilter;
import com.yonyou.ucf.mdd.api.interfaces.rpc.*;
import com.yonyou.ucf.mdd.api.utils.DubboConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.ServletComponentScan;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.ImportResource;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


/**
 * spring-boot 入口类
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class, RabbitAutoConfiguration.class})
@ComponentScan(basePackages = {"com.yonyou", "com.yonyoucloud"},
        excludeFilters = {@ComponentScan.Filter(type = FilterType.REGEX, pattern = {"com.yonyou.ucf.mdd.ext.*.*","com.yonyou.cloud.yts.*.*","com.yonyoucloud.uretail.*"})})
@ImportResource(locations = {DiworkEnv.DIWORK_CONFIG_XML,"classpath*:/config/applicationContext*.xml","classpath*:/spring-sub/applicationContext-billNumber-service.xml"})
@ServletComponentScan
public class MDFApplication extends SpringBootServletInitializer {

    public static void main(String[] args) throws IOException {
        //System.setProperty("mddRpcType", "dubbo");
        ApplicationContext app = SpringApplication.run(MDFApplication.class, args);

        //配置多语缓存 二选一
        //mlCacheConfigRedis(); //TODO 启动多语缓存请打开注释； 并且到此方法下面修改配置
        //mlCacheConfigDataBase();
        // 缓存通知配置
        NotifyStub.start();
    }
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        // 注意这里要指向原先用main方法执行的Application启动类
        return builder.sources(MDFApplication.class);
    }



//    @Bean
//    public HttpFirewall allowUrlEncodedSlashHttpFirewall() {
//        StrictHttpFirewall firewall = new StrictHttpFirewall();
//        firewall.setAllowUrlEncodedSlash(true);
//        return firewall;
//    }
    @Bean
    public ServletRegistrationBean printServlet(){
        return new ServletRegistrationBean(new PrintDelegateServlet(),"/print/printdelegate");
    }
    /**
     * ucf-log 日志接入
     * @return
     */
    @Bean
    public FilterRegistrationBean LogFilter() {
        FilterRegistrationBean registrationBean = new FilterRegistrationBean();
        registrationBean.setFilter(new MDCLogFilter());
        registrationBean.addUrlPatterns("/*");
        return registrationBean;
    }

    /**
     * J2v8 debugHelper
     * @return
     */
    @Bean
    public FilterRegistrationBean debugHelperFilter() {
        FilterRegistrationBean registrationBean = new FilterRegistrationBean();
        registrationBean.setFilter(new J2v8DebugHelperFilter());
        registrationBean.addUrlPatterns("/*");
        return registrationBean;
    }
    /**
     * 通过IRIS 注册RPC服务; 如果通过dubbo兼容方式注册请通过config/ 下的 xml 进行配置
     *
     * @return
     */
    @Bean
    public RPCBeanFactory mddServiceRpc() {
        // 服务域
        String domain = DubboConfig.getDubboProp("applicaiton.domain");
        List<String> serviceFullClassNames = new ArrayList<>();

        // 通用iris服务注册
        serviceFullClassNames.add(IComOperateApi.class.getName());
        serviceFullClassNames.add(IComQueryApi.class.getName());
        serviceFullClassNames.add(IRefApi.class.getName());
        serviceFullClassNames.add(IRuleApi.class.getName());
        serviceFullClassNames.add(IUimetaApi.class.getName());
        SpringExecuteTartgetLoader.putBeanCache(IComOperateApi.class, "mddComOperateApiService");
        SpringExecuteTartgetLoader.putBeanCache(IComQueryApi.class, "mddComQueryApiService");
        SpringExecuteTartgetLoader.putBeanCache(IRefApi.class, "mddRefApiService");
        SpringExecuteTartgetLoader.putBeanCache(IRuleApi.class, "mddRuleApiService");
        SpringExecuteTartgetLoader.putBeanCache(IUimetaApi.class, "mddUimetaApiService");

        return new RPCBeanFactory(domain, "c87e2267-1001-4c70-bb2a-ab41f3b81aa3", serviceFullClassNames);

    }
}
