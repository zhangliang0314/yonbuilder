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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.Map;

@Slf4j
@RunWith(value = SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = {MDFApplication.class})
public class ObjectStoreTest {
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
     * test Data Insert for Trigger
     */
    @Test
    public void testObjectStoreSaveForTrigger() throws Exception {
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractTrigger = require('AbstractTrigger')\n" +
                "  class MyTrigger extends AbstractTrigger {\n" +
                "    execute(context,param){\n" +
                "      var object = {string_0:\"0\",string_1:\"1\"};\n" +
                "        var res = ObjectStore.insert(\"AX001538.AX001538.shicz001\",object);\n" +
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
     * test Data Insert for Rest API
     */
    @Test
    public void testObjectStoreSaveForRestApi() throws Exception {
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript(" let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "  class MyAPIHandler extends AbstractAPIHandler {\n" +
                "    execute(req){\n" +
                "        var object = {string_0:\"0\",string_1:\"0\"};\n" +
                "        var res = ObjectStore.insert(\"AX001538.AX001538.shicz001\",object);\t\n" +
                "\t\treturn res;\n" +
                "    }\n" +
                "  }\n" +
                "  exports({\"entryPoint\":MyAPIHandler});");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data Insert Batch for Rest API
     */
    @Test
    public void testObjectStoreSaveBatch() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractTrigger = require('AbstractTrigger')\n" +
                "  class MyTrigger extends AbstractTrigger {\n" +
                "    execute(context,param){\n" +
                "\t\tvar objectList = [{name:\"qqq\",bustype:\"1639837036187904\",item41d:\"45gty\",isWfControlled:\"1\",verifystate:\"0\",returncount:\"0\",pX000008_tabpane0List:[{hasDefaultInit:true,item20l:\"www\"},{hasDefaultInit:true,item20l:\"mmm\"}]},{name:\"www\",bustype:\"1639837036187904\",item41d:\"45gty\",isWfControlled:\"1\",verifystate:\"0\",returncount:\"0\",pX000008_tabpane0List:[{hasDefaultInit:true,item20l:\"rrr\"},{hasDefaultInit:true,item20l:\"ttt\"}]}];\n" +
                "        var res = ObjectStore.insertBatch(\"developplatform.AX000003.PX000008\",objectList);  \n" +
                "\t\treturn res;\n" +
                "    }\n" +
                "  }\n" +
                "exports({\"entryPoint\":MyTrigger}); ");
        info.setEntrypoint("_executeRule__");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data UpdateById for Rest API
     */
    @Test
    public void testObjectStoreUpdateByIdForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript(" let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "  class MyAPIHandler extends AbstractAPIHandler {\n" +
                "    execute(req){\n" +
                "        var object = {id:\"9aaba30d64024bd3a7a0064e663ef11a\",name:\"ppp\",bustype:\"1639837036187904\",item41d:\"45gty\",pX000008_tabpane0List:[{hasDefaultInit:true,item20l:\"ppp\",_status:\"Insert\"},{id:\"30cf2fd836104ec092e301378a57d8c5\",_status:\"Delete\"}]};\n" +
                "        var res = ObjectStore.updateById(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "\t\treturn res;\n" +
                "    }\n" +
                "  }\n" +
                "  exports({\"entryPoint\":MyAPIHandler}); ");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data UpdateBatch for Rest API
     */
    @Test
    public void testObjectStoreUpdateBatchForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript(" let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req,res){\n" +
                "    var object = [{id:\"9aaba30d64024bd3a7a0064e663ef11a\",name:\"ttt\",bustype:\"1639837036187904\",item41d:\"45gty\",pX000008_tabpane0List:[{hasDefaultInit:true,item20l:\"ttt\",_status:\"Insert\"},{id:\"6371035f6675467ca2ab792f947b3852\",_status:\"Delete\"}]},{id:\"f90f499b5c8c49a58f5ad8a69e7cd572\",name:\"yyy\",bustype:\"1639837036187904\",item41d:\"45gty\",pX000008_tabpane0List:[{hasDefaultInit:true,item20l:\"www\",_status:\"Insert\"},{id:\"c2888cb64a19486aafee7a54de444ba3\",_status:\"Delete\"},{id:\"e23fbfe0674b4605af4c7da47a9706d7\",item20l:\"yyyy\",_status:\"Delete\"}]}];\n" +
                "    var res = {};" +
                "    res.data = ObjectStore.updateBatch(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "    return res;" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler});   ");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data DeleteById for Rest API
     */
    @Test
    public void testObjectStoreDeleteByIdForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req,res){\n" +
                "    var object = {id:\"9aaba30d64024bd3a7a0064e663ef11a\",pubts:\"2020-04-11 08:53:25\",pX000008_tabpane0List:[{id:\"7f4565cab9f3474d9eae23c6ebf4eef3\"}]};\n" +
                "    var res = {};" +
                "    res.data = ObjectStore.deleteById(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "    return res;" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler}); ");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data DeleteBatch for RestApi
     */
    @Test
    public void testObjectStoreDeleteBatchForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req,res){\n" +
                "    var object = [{id:\"f90f499b5c8c49a58f5ad8a69e7cd572\",pubts:\"2020-04-11 08:53:26\",pX000008_tabpane0List:[{id:\"e7fc0f7db899473dbbab2c23cb21df30\",_status:\"Delete\"}]},{id:\"fc911f67b5ce4d7ebb422287aabab76c\",pubts:\"2020-04-10 18:03:30\",pX000008_tabpane0List:[{id:\"61887b75cbab4ad787663e161b4ddd0e\",_status:\"Delete\"}]}];\n" +
                "    var res = {};" +
                "    res.data = ObjectStore.deleteBatch(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "    return res;" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler});");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data deleteByMap for Rest Api
     * 删除
     */
    @Test
    public void testObjectStoreDeleteByMapForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req,res){\n" +
                "    var object = {\n" +
                "\tname:\"qqq\",\n" +
//                "\tcreator:\"xxx\",\n" +
//                "id:\"2b4bd236460b4a98bd2881ee60549c40\"," +
                "\tcompositions:[\n" +
                "\t   {\n" +
                "            name:\"pX000008_tabpane0List\",\n" +
                "            compositions:[\n" +
                "              \n" +
                "            ]\n" +
                "       }\n" +
                "\t]\n" +
                "};\n" +
                "    var res = {};" +
                "    res.data = ObjectStore.deleteByMap(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "    return res;" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler});");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * YonQL查询
     * @throws Exception
     */
    @Test
    public void testObjectStoreQueryByYonQLForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req){\n" +
                "    var res = {};\n" +
                "\tres.data = ObjectStore.queryByYonQL('select * from online0205.treeucfbase.treeucfbase_Treetable');\t\n" +
                "\treturn res;\n" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler});");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * YonQL查询
     * @throws Exception
     */
    @Test
    public void testObjectStoreQueryByYonQLForTrigger() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractTrigger = require('AbstractTrigger')\n" +
                "  class MyTrigger extends AbstractTrigger {\n" +
                "    execute(context,param){\n" +
                "\t\tvar res = ObjectStore.queryByYonQL('select * from online0205.treeucfbase.treeucfbase_Treetable');\t\n" +
                "\t\treturn res;\n" +
                "    }\n" +
                "  }\n" +
                "exports({\"entryPoint\":MyTrigger});\t");
        info.setEntrypoint("_executeRule__");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data selectById for Rest Api
     * 主子实体同时查询
     */
    @Test
    public void testObjectStoreSelectByIdForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req){\n" +
                "    var object = {\n" +
                "    id:\"23933100c51d454a84e51906f8bdef81\",\n" +
                "    compositions:[\n" +
                "        {\n" +
                "            name:\"pX000008_tabpane0List\",\n" +
                "            compositions:[\n" +
                "              \n" +
                "            ]\n" +
                "        }\n" +
                "    ]\n" +
                "};\n" +
                "    var res = {};\n" +
                "    res.data = ObjectStore.selectById(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "\t\treturn res;\n" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler}); ");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data selectById for Rest Api
     * 主子实体同时查询
     */
    @Test
    public void testObjectStoreSelectByIdForMainChildGrandChildren() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req){\n" +
                "    var object = {\n" +
                "    id:\"5830f15a5fb04317b854d4c7e895d4a8\",\n" +
                "    compositions:[\n" +
                "        {\n" +
                "            name:\"pX000008_tabpane0List1\",\n" +
                "            compositions:[\n" +
                "                {\n" +
                "                    name:\"pX000008_tabpane0List3\",\n" +
                "                    compositions:[\n" +
                "\t\t\t\t\t\t{\n" +
                "\t\t\t\t\t\t\tname:\"pX000008_tabpane0List6\"\n" +
                "\t\t\t\t\t\t}\t\t\t\t\t\t\n" +
                "                    ]\n" +
                "                },{\n" +
                "                    name:\"pX000008_tabpane0List4\",\n" +
                "                    compositions:[\n" +
                "\n" +
                "                    ]\n" +
                "                }\n" +
                "            ]\n" +
                "        },\n" +
                "        {\n" +
                "            name:\"pX000008_tabpane0List2\",\n" +
                "            compositions:[\n" +
                "                {\n" +
                "                    name:\"pX000008_tabpane0List5\",\n" +
                "                    compositions:[\n" +
                "\n" +
                "                    ]\n" +
                "                }\n" +
                "            ]\n" +
                "        }\n" +
                "    ]\n" +
                "};\n" +
                "    var res = {};\n" +
                "    res.data = ObjectStore.selectById(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "\t\treturn res;\n" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler}); ");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data selectById for Rest Api
     * // 只查询主实体
     */
    @Test
    public void testObjectStoreSelectByIdOnlyMainEntityForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req,res){\n" +
                "    var object = {\n" +
                "    id:\"23933100c51d454a84e51906f8bdef81\",\n" +
                "    compositions:[\n" +
                "        \n" +
                "    ]\n" +
                "};\n" +
                "    var res = {};\n" +
                "    res.data = ObjectStore.selectById(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "\t\treturn res;\n" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler}); ");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }


    /**
     * test Data selectById for Rest Api
     * 只查询主实体
     */
    @Test
    public void testObjectStoreSelectBatchIdsOnlyForMainEntityForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req,res){\n" +
                "    var object = {\n" +
                "    ids:[\"23933100c51d454a84e51906f8bdef81\",\"9f265cd61a354dae8d9331c0984fb249\",\"fbcb63907d094c52b3968b9399d105a9\"],\n" +
                "    compositions:[\n" +
                "    ]\n" +
                "   };\n" +
                "    var res = {};\n" +
                "    res.data = ObjectStore.selectBatchIds(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "\t\treturn res;\n" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler}); ");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data selectById for Rest Api
     * 主子实体同时查询
     */
    @Test
    public void testObjectStoreSelectBatchIdsForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req,res){\n" +
                "    var object = {\n" +
                "    ids:[\"5830f15a5fb04317b854d4c7e895d4a8\",\"2b4bd236460b4a98bd2881ee60549c40\",\"2b84ee085d2949d5a88c8499c6d74a6e\"],\n" +
                "    compositions:[\n" +
                "        {\n" +
                "            name:\"pX000008_tabpane0List\",\n" +
                "            compositions:[\n" +
                "              \n" +
                "            ]\n" +
                "        }\n" +
                "    ]\n" +
                "};\n" +
                "    var res = {};\n" +
                "    res.data = ObjectStore.selectBatchIds(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "\t\treturn res;\n" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler});");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data selectByMap for Rest Api
     * 只查询主实体
     */
    @Test
    public void testObjectStoreSelectByMapOnlyForMainEntityForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req){\n" +
                "    var object = {\n" +
                "\tname:\"qqq\",\n" +
                "\tcreator:\"xxx\",\n" +
                "\tcompositions:[\n" +
                "\t   \n" +
                "\t]\n" +
                "};\n" +
                "    var res = {};\n" +
                "    res.data = ObjectStore.selectByMap(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "\t\treturn res;\n" +
                "\t\treturn res;\n" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler}); ");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }

    /**
     * test Data selectByMap for Rest Api
     * 主子实体同时查询
     */
    @Test
    public void testObjectStoreSelectByMapForRestApi() throws Exception{
        ScriptInfo info = new ScriptInfo();
        info.setParam("{\"customMap\":{\"param\":{\"a\":\"aaa\"}}}");
        info.setScript("let AbstractAPIHandler = require('AbstractAPIHandler')\n" +
                "class MyAPIHandler extends AbstractAPIHandler {\n" +
                "  execute(req,res){\n" +
                "    var object = {\n" +
                "\tname:\"qqq\",\n" +
                "\tcreator:\"xxx\",\n" +
                "\tcompositions:[\n" +
                "\t   {\n" +
                "            name:\"pX000008_tabpane0List\",\n" +
                "            compositions:[\n" +
                "              \n" +
                "            ]\n" +
                "       }\n" +
                "\t]\n" +
                "};\n" +
                "    res = ObjectStore.selectByMap(\"developplatform.AX000003.PX000008\",object);\t\n" +
                "  }\n" +
                "}\n" +
                "exports({\"entryPoint\":MyAPIHandler});");
        info.setEntrypoint("_apiexec_");
        info.setExtScriptId("aaaa");
        Map<String, Object> map = YonScriptEngine.execute(info, null);
        log.info(JsonUtils.toJsonString(map));
    }
}
