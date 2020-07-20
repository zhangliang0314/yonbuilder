package com.yonyou.ucf.mdd;

import com.yonyou.ucf.mdd.bpm.service.ProcessService;
import com.yonyou.ucf.mdd.common.context.MddBaseContext;
import com.yonyou.ucf.mdf.MDFApplication;
import org.imeta.biz.base.Objectlizer;
import org.imeta.orm.base.BizObject;
import org.imeta.orm.base.Json;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.List;

@RunWith(value = SpringJUnit4ClassRunner.class)
@SpringBootTest(classes={MDFApplication.class})
public class BPMTest {

    @Test
    public void startBpm(){
        String bills = "[{\"returncount\":0,\"verifystate\":0,\"creator\":\"31d4111e-e61b-484c-a7ab-542a023581cf\",\"billmaketime\":\"2019-07-21 22:17:52\",\"edit_time\":\"2019-07-11 00:00:00\",\"isWfControlled\":true,\"pk_org__name\":\"海贼王\",\"bill_code\":\"DJJH201907210002\",\"bill_status\":0,\"pk_org\":\"1287492174729472\",\"billmaker\":\"31d4111e-e61b-484c-a7ab-542a023581cf\",\"transi_type\":\"4B62-01\",\"id\":\"9e36a309a55e44cba5841fa6d388557a\",\"creationtime\":\"2019-07-21 22:18:09\",\"pubts\":\"2019-07-25 12:15:46\",\"tenant\":\"f8i8k0ut\"}]";
        Json json = new Json(bills);
        //List<BizObject> list = Objectlizer.decode(json, "emm.pointcheck.PCPlanHeadVO");
        ProcessService service = MddBaseContext.getBean(ProcessService.class);
        String userId = "792cd355-eec3-4f34-8ec1-4cb216a02eea";
        String categoryId = "1317403066470656";//"4B62-01";
        String procInstName="点检计划DJJH201907210002";
        String businessKey="emm_pcplan_card_0064438d790e45c4a9a8560ae8d59309";
        //String businessKey="emm_pcplan_card_20a2ccb613294b29b0d2c7fa25cea045";

        String limitTenantId="f8i8k0ut";
        String org = "1287492174729472";
        BizObject bill = new BizObject();
        try {
            //service.testStartBpm(userId,categoryId,procInstName,businessKey,limitTenantId,org,bill);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void withdraw(){
        ProcessService service = MddBaseContext.getBean(ProcessService.class);
        //service.testwithdraw();
    }

    /**
     * 注册终审
     * @throws Exception
     */
    @Test
    public void registerCompleteInterface() throws Exception {
        ProcessService service = MddBaseContext.getBean(ProcessService.class);
        String userId = "792cd355-eec3-4f34-8ec1-4cb216a02eea";
        String limitTenantId="f8i8k0ut";
        String id = "4e13d643-b1c4-11e9-81b9-aa736fd31fe5";
        //service.testRegisterInterface(userId, limitTenantId, id);
        service.registerInterface( userId, limitTenantId, id);
    }

    /**
     * 注册详情
     * @throws Exception
     */
    @Test
    public void registerDetailInterface() throws Exception {
        ProcessService service = MddBaseContext.getBean(ProcessService.class);
        String userId = "792cd355-eec3-4f34-8ec1-4cb216a02eea";
        String limitTenantId="f8i8k0ut";
        service.registerDetailAddress( userId, limitTenantId, false,null);
    }

    @Test
    public void queryRegisItf() throws Exception {
        ProcessService service = MddBaseContext.getBean(ProcessService.class);
        String userId = "792cd355-eec3-4f34-8ec1-4cb216a02eea";
        String limitTenantId="f8i8k0ut";
        String categoryId = "1317403066470656";//"4B62-01";
        String queryModelId = "4e13d643-b1c4-11e9-81b9-aa736fd31fe5";
        String result = service.QueryRegisterInterface(userId, limitTenantId,categoryId,queryModelId);
        System.out.println(result);
    }

}
