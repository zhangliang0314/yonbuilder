package com.yonyou.ucf.mdf.app.mobile.module;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.google.common.collect.Lists;
import lombok.Getter;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Mobile使用的REST Template, 是用独立的连接池, 不和其他应用混淆, 不被其他配置影响, 如SpringMVC
 * 使用Jackson作为序列化和反序列化
 *
 * @author liuhaoi
 */
@Getter
public class MobileRestTemplate {

    private RestTemplate restTemplate;

    protected static Map<Class<?>, PoolingHttpClientConnectionManager> managers = new HashMap<>();

    public MobileRestTemplate(long connectionTimeout, long readTimeout, int maxTotal, int defaultMaxPerRoute, ApplicationContext context) {
        this.restTemplate = new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofMillis(connectionTimeout))
                .setReadTimeout(Duration.ofMillis(readTimeout))
                .messageConverters(getHttpMessageConverters(context))
                .customizers(restTemplate -> {
                    HttpClient httpClient = HttpClientBuilder.create()
                            .setConnectionManager(getPoolingHttpClientConnectionManager(maxTotal, defaultMaxPerRoute))
                            .setConnectionManagerShared(true)
                            .build();
                    //创建HttpComponentsClientHttpRequestFactory
                    HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory(httpClient);
                    requestFactory.setConnectionRequestTimeout(1000);
                    restTemplate.setRequestFactory(requestFactory);
                })
                .build();
    }

    protected PoolingHttpClientConnectionManager getPoolingHttpClientConnectionManager(int maxTotal, int defaultMaxPerRoute) {
        //创建连接管理器
        PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
        connectionManager.setMaxTotal(maxTotal);
        connectionManager.setDefaultMaxPerRoute(defaultMaxPerRoute);
        managers.put(this.getClass(), connectionManager);
        return connectionManager;
    }

    protected List<HttpMessageConverter<?>> getHttpMessageConverters(ApplicationContext context) {
        List<HttpMessageConverter<?>> messageConverters = new ArrayList<>();

        messageConverters.add(new FormHttpMessageConverter());
        messageConverters.add(new ByteArrayHttpMessageConverter());
        messageConverters.add(new StringHttpMessageConverter());

        Map<String, ObjectMapper> beansOfType = context.getBeansOfType(ObjectMapper.class);

        ObjectMapper mapper = beansOfType.values()
                .stream()
                .findFirst()
                .orElseGet(this::buildDefaultObjectMapper);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(mapper);
        //部分接口不标准,返回的格式为text/plain或者application/octet-stream,这里做兼容
        converter.setSupportedMediaTypes(Lists.newArrayList(MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN, MediaType.APPLICATION_OCTET_STREAM));
        messageConverters.add(converter);
        return messageConverters;
    }

    protected ObjectMapper buildDefaultObjectMapper() {

        ObjectMapper objectMapper = new ObjectMapper();

        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Ignore null values when writing json.
        objectMapper.configure(SerializationFeature.WRITE_NULL_MAP_VALUES, false);
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // Write times as a String instead of a Long so its human readable.
        objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, true);

        return objectMapper;

    }

}
