package com.yonyou.ucf.mdf;

import com.yonyou.cloud.inotify.client.NotifyStub;
import com.yonyou.diwork.filter.DiworkRequestListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;

@Configuration
public class SpringMvcConfig implements WebMvcConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(SpringMvcConfig.class);
    public  SpringMvcConfig(){
        try {
            NotifyStub.start();
        } catch (IOException e) {
            logger.error(e.getMessage(),e);
        }
    }

    /**
     * 配置请求上下文拦截器
     */
    @Bean
    public FilterRegistrationBean RequestListener() {
        FilterRegistrationBean registrationBean = new FilterRegistrationBean();
        registrationBean.setFilter(new DiworkRequestListener());
        registrationBean.addUrlPatterns("/*");
        registrationBean.addInitParameter("excludedPages", "/api/yonscript/,/billstaterule,/graphql,/pub/fileupload/download,/bpm/complete,/bpm/registerInterface,/bpm/,/upd/,/test,/formula/,/tenant/,/mobile/app/");
        return registrationBean;
    }

}
