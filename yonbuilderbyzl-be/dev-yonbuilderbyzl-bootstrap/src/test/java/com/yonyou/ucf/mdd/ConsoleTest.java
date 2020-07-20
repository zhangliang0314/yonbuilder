package com.yonyou.ucf.mdd;

import com.eclipsesource.v8.V8;
import com.yonyou.cloud.yonscript.YonScriptEngine;
import com.yonyou.cloud.yonscript.entity.ScriptInfo;
import com.yonyou.cloud.yonscript.utils.V8PoolMan;
import com.yonyou.iuap.context.InvocationInfoProxy;
import com.yonyou.ucf.mdf.MDFApplication;
import com.yonyou.ucf.mdd.common.context.MddBaseContext;
import com.yonyou.workbench.util.JsonUtils;
import lombok.extern.slf4j.Slf4j;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.MDC;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.Map;

@Slf4j
@RunWith(value = SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = {MDFApplication.class})
public class ConsoleTest {

    // V8实例池
    V8PoolMan v8pool = V8PoolMan.newIns();
    V8 v8 = v8pool.getV8FromPool();

    @Before
    public void before() {
        MddBaseContext.setTenantId("gb0ucj8l");
        InvocationInfoProxy.setTenantid("gb0ucj8l");
        MddBaseContext.setThreadContext("userId", "xxx");
    }

    @After
    public void after() {
        v8pool.returnV8toPool(v8);
    }

    /**
     * test console log
     */
    @Test
    public void testConsoleLogWithArguments() throws Exception {
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractTrigger = require('AbstractTrigger')\n" +
                "  class MyTrigger extends AbstractTrigger {\n" +
                "    execute(context,param){\n" +
                "      var object = {name:\"qqq\",bustype:\"1639837036187904\",item41d:\"45gty\",isWfControlled:\"1\",verifystate:\"0\",returncount:\"0\",pX000008_tabpane0List:[{hasDefaultInit:true,item20l:\"www\"},{hasDefaultInit:true,item20l:\"mmm\"}]};\n" +
                "       console.warn('hello {} world!!!{}','my god','your god');" +
                "        var res = ObjectStore.insert(\"developplatform.AX000003.PX000008\",object);\n" +
                "        return res;\n" +
                "    }\n" +
                "  }\n" +
                "exports({\"entryPoint\":MyTrigger});");
        info.setEntrypoint("_executeRule__");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }


    /**
     * test console log
     */
    @Test
    public void testConsoleLog() throws Exception {
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractTrigger = require('AbstractTrigger')\n" +
                "  class MyTrigger extends AbstractTrigger {\n" +
                "    execute(context,param){\n" +
                "      var object = {name:\"qqq\",bustype:\"1639837036187904\",item41d:\"45gty\",isWfControlled:\"1\",verifystate:\"0\",returncount:\"0\",pX000008_tabpane0List:[{hasDefaultInit:true,item20l:\"www\"},{hasDefaultInit:true,item20l:\"mmm\"}]};\n" +
                "       console.info('hello world!!!');" +
                "        var res = ObjectStore.insert(\"developplatform.AX000003.PX000008\",object);\n" +
                "        return res;\n" +
                "    }\n" +
                "  }\n" +
                "exports({\"entryPoint\":MyTrigger});");
        info.setEntrypoint("_executeRule__");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }
}
