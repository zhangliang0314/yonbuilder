package com.yonyou.ucf.mdf.app.mobile.web.controller;

import com.alibaba.fastjson.JSON;
import com.yonyou.ucf.mdf.app.mobile.MobileProperties;
import com.yonyou.ucf.mdf.app.mobile.module.MobileCrossOriginStrategy;
import com.yonyou.ucf.mdf.app.mobile.module.MobileRestTemplate;
import com.yonyou.ucf.mdf.app.mobile.web.controller.pojo.CommonResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestTemplate;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Objects;

@Slf4j
@Controller
@RequestMapping("/mobile/app/")
public class MobileIndexMenuController {

    private static final String PATH_APP_MENU = "hpamenu/getMenuListByMobile?appCode=%s";

    private final MobileProperties properties;

    private final RestTemplate restTemplate;

    private final MobileCrossOriginStrategy mobileCrossOriginStrategy;

    public MobileIndexMenuController(MobileProperties properties, ApplicationContext context,
                                     MobileCrossOriginStrategy mobileCrossOriginStrategy) {
        this.properties = properties;
        this.restTemplate = new MobileRestTemplate(1000L, 3000L, 300, 100, context).getRestTemplate();
        this.mobileCrossOriginStrategy = mobileCrossOriginStrategy;
    }

    @GetMapping(value = "/menu/list", produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    public void getMenuList(@RequestParam String appCode, @CookieValue String wb_at, HttpServletRequest request,
                            HttpServletResponse response) throws IOException {
        String appMenuListHost = properties.getAppMenuListHost();
        String split;
        if (appMenuListHost.endsWith("/")) {
            split = "";
        } else {
            split = "/";
        }
        String url = appMenuListHost + split + String.format(PATH_APP_MENU, appCode);

        mobileCrossOriginStrategy.writeAllowCrossDomainHeaders(request, response);

        MultiValueMap<String, String> headers = new HttpHeaders();
        headers.set(HttpHeaders.COOKIE, String.format("wb_at=%s", wb_at));
        headers.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> responseEntity;
        try {
            responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
        } catch (Exception e) {
            response.getWriter().write(JSON.toJSONString(CommonResponse.failed("request app menu failed", "500")));
            return;
        }

        response.getWriter().write(Objects.requireNonNull(responseEntity.getBody()));
    }


}
