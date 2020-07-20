package com.yonyou.ucf.mdd;

import com.yonyou.ucf.mdd.common.model.uimeta.filter.vo.FilterVO;
import com.yonyou.ucf.mdd.common.utils.json.GsonHelper;
import com.yonyou.ucf.mdf.MDFApplication;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

//import com.yonyou.ucf.mdd.utils.TplValUtil;

@RunWith(value = SpringJUnit4ClassRunner.class)
@SpringBootTest(classes={MDFApplication.class})
public class TplValUtilTest {
    @Test
    public void test () {
//        Map<String, Object> map = new HashMap<String, Object> ();
//        map.put("tenant", 123);
//        CommonUtil.setContext("user", map);
//        // String str = TplValUtil.handelTplVal("$user.tenant$");
//        String str = TplValUtil.handelTplVal("{\"123\":$user.tenant$,\"444\":$tt}");
//        System.out.println(str);
    }

    @Test
    public void test2 () {
        String str = "{\"extend\":true,\"filtersId\":0,\"isDefault\":0,\"simpleVOs\":[{\"conditions\":[{\"field\":\"code\",\"op\":\"like\",\"token\":0},{\"field\":\"name\",\"op\":\"like\",\"token\":0}],\"logicOp\":\"or\",\"token\":0},{\"field\":\"id\",\"op\":\"in\",\"token\":0,\"value1\":[\"1389799314002178\"]}],\"solutionId\":0}";
        // FilterVO filterVO = JSON.parseObject(str, FilterVO.class);
        FilterVO filterVO = (FilterVO) GsonHelper.FromJSon(str, FilterVO.class);
        System.out.println(filterVO);
    }
}
