package com.yonyou.ucf.mdf.app.mobile.web.controller;

import com.alibaba.fastjson.JSON;
import com.yonyou.diwork.exception.DiworkRuntimeException;
import com.yonyou.ucf.mdf.app.mobile.module.MobileCrossOriginStrategy;
import com.yonyou.ucf.mdf.app.mobile.module.MobileYhtContextSetupService;
import com.yonyou.ucf.mdf.app.mobile.module.YhtTokenCipherDecryptService;
import com.yonyou.ucf.mdf.app.mobile.web.controller.pojo.CommonResponse;
import com.yonyou.workbench.cons.Constants;
import com.yonyou.workbench.util.SDKResultUtils;
import com.yonyou.yht.sdk.UserCenter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/mobile/app/")
public class MobileYhtAccessTokenController {

    private final MobileYhtContextSetupService yhtContextSetupService;

    private final MobileCrossOriginStrategy mobileCrossOriginStrategy;

    private final YhtTokenCipherDecryptService yhtTokenCipherDecryptService;

    @RequestMapping(value = "index/yht/token/context")
    public CommonResponse auth(@RequestParam String yhtAccessTokenCipher, @CookieValue(required = false) String yht_access_token,
                               @RequestParam String userId, @RequestParam String tenantId, HttpServletRequest request, HttpServletResponse response) {
        mobileCrossOriginStrategy.writeAllowCrossDomainHeaders(request, response);
        try {
            String yhtAccessToken = yhtTokenCipherDecryptService.decrypt(yhtAccessTokenCipher);
            return doAuth(yhtAccessToken, yht_access_token, userId, tenantId, request, response);
        } catch (Exception e) {
            return CommonResponse.failed(e.getMessage(), "500010");
        }
    }

    public CommonResponse doAuth(String yhtAccessToken, String yht_access_token, String userId, String tenantId, HttpServletRequest request,
                                 HttpServletResponse response) {

        //cookie中已经设置
        if (yhtAccessToken.equals(yht_access_token)) {
            return CommonResponse.noOp();
        }

        Map<String, Object> context = yhtContextSetupService.buildYhtAccessTokenContext(tenantId, userId);

        syncYhtAccessTokenContextInfo(yhtAccessToken, context);

        writeCookieToDevice(request, response, yhtAccessToken);

        return CommonResponse.success();
    }

    private void writeCookieToDevice(HttpServletRequest request, HttpServletResponse response, String yhtAccessToken) {
        Cookie cookie = new Cookie(Constants.YHT_ACCESS_TOKEN, yhtAccessToken);
        cookie.setDomain(MobileLoginController.getBaseDomain(request));
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        response.addCookie(cookie);
    }

    private void syncYhtAccessTokenContextInfo(String yhtAccessToken, Map<String, Object> context) {
        String setTenantResult = UserCenter.setUserCurrentTenant(yhtAccessToken, context);
        if (SDKResultUtils.getData(setTenantResult).isSuccess()) {
            return;
        }
        String errorMessage = String
                .format("setUserCurrentTenant error!! token:%s,values:%s,result:%s", yhtAccessToken, JSON.toJSONString(context), setTenantResult);
        log.error(errorMessage);
        throw new DiworkRuntimeException("友户通服务异常", new RuntimeException(errorMessage));
    }

}
