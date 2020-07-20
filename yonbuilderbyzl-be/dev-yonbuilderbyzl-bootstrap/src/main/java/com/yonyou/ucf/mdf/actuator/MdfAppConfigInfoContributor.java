//package com.yonyou.ucf.mdf.actuator;
//
//import com.yonyou.ucf.mdd.common.context.MddBaseContext;
//import com.yonyou.ucf.mdd.rule.load.RuleSDKContext;
//import com.yonyou.ucf.mdd.uimeta.load.UIMetaSDKContext;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.boot.actuate.info.Info;
//import org.springframework.boot.actuate.info.InfoContributor;
//import org.springframework.stereotype.Component;
//
//import java.util.LinkedHashMap;
//import java.util.Map;
//
//@Component
//public class MdfAppConfigInfoContributor implements InfoContributor {
//
//    @Value("${spring.application.name}")
//    private String applicationName;
//
//    @Override
//    public void contribute(Info.Builder builder) {
//
//        Map<String, Object> map = new LinkedHashMap<>();
//        map.put("application-name", applicationName);
//        map.put("mdd-version",MddBaseContext.class.getPackage().getImplementationVersion());//TODO 验证
//        map.put("mdd-rule-props", RuleSDKContext.getRuleConfProps().toString());
//        map.put("mdd-uimeta-props", UIMetaSDKContext.getUIMetaConfProps().toString());
//        builder.withDetail("mdf_app_config",map);
//    }
//
//}
