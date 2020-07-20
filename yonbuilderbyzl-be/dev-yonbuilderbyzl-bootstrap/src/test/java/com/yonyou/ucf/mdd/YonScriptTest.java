package com.yonyou.ucf.mdd;

import com.eclipsesource.v8.JavaVoidCallback;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Object;
import com.yonyou.cloud.yonscript.utils.V8PoolMan;
import com.yonyou.ucf.mdf.MDFApplication;
import com.yonyou.ucf.mdf.javascript.api.dao.Query;
import com.yonyou.workbench.util.JsonUtils;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@Slf4j
@RunWith(value = SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = {MDFApplication.class})
public class YonScriptTest {

    /**
     * Java method registered as callback to JS
     * can be registered on a V8 object or Global namespace
     */
    @Test
    public void testCallback() {
        V8PoolMan v8pool = V8PoolMan.newIns();
        V8 v8 = v8pool.getV8FromPool();
        v8.registerJavaMethod(new YonScriptTest(), "print", "printjs", new Class<?>[]{String.class});
        v8.executeVoidScript("printjs('Hello World!');");
        v8pool.returnV8toPool(v8);
    }


    /**
     *
     */
    @Test
    public void testImplementsJavaVoidCallBack() {
        V8PoolMan v8pool = V8PoolMan.newIns();
        V8 v8 = v8pool.getV8FromPool();
        JavaVoidCallback callback = new JavaVoidCallback() {
            @Override
            public void invoke(V8Object receiver, V8Array parameters) {
                if (parameters.length() > 0) {
                    Object arg0 = parameters.get(0);
                    log.debug("arg0: " + arg0);
                }
            }
        };

        v8.registerJavaMethod(callback, "printhello");
        v8.executeScript("printhello('I say Hello World!');");
        v8pool.returnV8toPool(v8);
    }

    /**
     * test Data query
     */
    @Test
    public void testImplementsJavaRegisterDataQuery() {
        V8PoolMan v8pool = V8PoolMan.newIns();
        V8 v8 = v8pool.getV8FromPool();

        // 正常流程执行ExtBackEndRule会执行该方法的注册，测试流程手动注册
        v8.registerJavaMethod(new Query(), "query");
        Object result = v8.executeScript("query('select * from online0205.treeucfbase.treeucfbase_Treetable')");
        log.debug(JsonUtils.toJsonString(result));

        v8pool.returnV8toPool(v8);
    }

    /**
     * Call JavaScript
     */
    @Test
    public void testCallJavaScript() {
        V8PoolMan v8pool = V8PoolMan.newIns();
        V8 v8 = v8pool.getV8FromPool();

        String js = "var foo = function(x) {return 42+x;}";
        v8.executeVoidScript(js);
        V8Array parameters = new V8Array(v8).push(3);
        int result = v8.executeIntegerFunction("foo", parameters);
        log.debug("result: " + result);

        v8pool.returnV8toPool(v8);
    }


    /**
     * Call JavaScript
     */
    @Test
    public void testCallJavaScriptObject() {
        V8PoolMan v8pool = V8PoolMan.newIns();
        V8 v8 = v8pool.getV8FromPool();

        String js = "var me = {First:'Robert',Middle:'Ian',Last:'Bull',age:36};";
        V8Object result = v8.executeObjectScript(js + "me;");
        log.debug(result.getString("Last") + result.getString("First"));

        v8pool.returnV8toPool(v8);
    }

    /**
     * 向J2V8注册的方法
     *
     * @param str
     */
    public void print(String str) {
        System.out.println(str);
    }
}
