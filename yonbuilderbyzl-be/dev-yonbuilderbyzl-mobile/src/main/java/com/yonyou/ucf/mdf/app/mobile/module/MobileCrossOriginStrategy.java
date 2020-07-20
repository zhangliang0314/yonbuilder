package com.yonyou.ucf.mdf.app.mobile.module;

import com.yonyou.ucf.mdf.app.mobile.MobileProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
@Component
public class MobileCrossOriginStrategy {

    private final MobileProperties properties;

    public void writeAllowCrossDomainHeaders(HttpServletRequest httpRequest, HttpServletResponse httpServletResponse) {

        String origin = httpRequest.getHeader("Origin");

        String name = "Access-Control-Allow-Origin";

        if (httpServletResponse.getHeader(name) != null || StringUtils.isBlank(origin)) {
            return;
        }

        URL url;
        try {
            url = new URL(origin);
        } catch (MalformedURLException e) {
            log.warn("MalformedURLException: invalid origin {}", origin);
            return;
        }
        String host = url.getHost();
        Optional<String> bingo = Arrays.stream(properties.getCrossDomainWhitelist()).filter(host::endsWith).findAny();
        if (!bingo.isPresent()) {
            return;
        }

        if (origin.trim().length() > 0 && !"null".equalsIgnoreCase(origin)) {
            httpServletResponse.setHeader(name, origin);
        } else {
            httpServletResponse.setHeader(name, "*");
        }

        // you probably don't need to change this one, it's indicating what headers you will use. There is no wildcard for this one
        httpServletResponse
                .setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, origin, " +
                        "content-type, accept, authorization, access-control-request-method");
        httpServletResponse.setHeader("Access-Control-Allow-Credentials", "true");
        httpServletResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
        // the max age policy to renew CORS check. Here it's 14 days long
        httpServletResponse.setHeader("Access-Control-Max-Age", "1209600");
        //解决IE iframe 跨域session丢失问题
        httpServletResponse.setHeader("P3P", "CP=CAO PSA OUR");
    }
}
