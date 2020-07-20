package com.yonyou.ucf.mdd;


import java.io.File;
import java.io.IOException;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.junit.Test;

import com.eclipsesource.v8.V8;
import com.yonyou.cloud.yonscript.YonScriptEngine;
import com.yonyou.cloud.yonscript.entity.ScriptInfo;
import com.yonyou.cloud.yonscript.utils.V8PoolMan;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class YonScriptEngTest {
//	 @Test
//	    public void testCallback() throws IOException {
//	        V8PoolMan v8pool  = V8PoolMan.newIns();
//	        V8 v8 = v8pool.getV8FromPool();
//	        String script = FileUtils.readFileToString(new File( "/Volumes/data/a.js"),"UTF-8");
//	        v8.executeScript(script);
//	        Object oj8k =  v8.executeFunction("lbm", null);
//	        v8pool.returnV8toPool(v8);
//	    }

	 @Test
	    public void testModule() throws Exception {
		 ScriptInfo info = new ScriptInfo();
	        String script = FileUtils.readFileToString(new File( "/Volumes/data/b.js"),"UTF-8");

         info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
         info.setScript(script);
         info.setExtScriptId("aaa");
         info.setEntrypoint("_executeRule__");
         Map<String, Object> map = YonScriptEngine.execute(info, null);
         System.out.println(map);
	    }
	 
}
