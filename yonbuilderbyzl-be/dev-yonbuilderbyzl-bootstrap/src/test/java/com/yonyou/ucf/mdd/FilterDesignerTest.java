package com.yonyou.ucf.mdd;

import com.yonyou.ucf.mdd.common.interfaces.uimeta.IFilterService;
import com.yonyou.ucf.mdf.MDFApplication;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.HashMap;
import java.util.Map;

@RunWith(value = SpringJUnit4ClassRunner.class)
@SpringBootTest(classes={MDFApplication.class})
public class FilterDesignerTest {

    @Autowired
    private IFilterService filterService;

    @Test
    public void test1() {
        Map<String, Object> solutionMap = new HashMap<>();
        solutionMap.put("tenantId", "a65xtqwz");
        // solutionMap.put("id", "711867139");
        solutionMap.put("filtersId", 2);
//        filterService.saveSolution(solutionMap, "a65xtqwz");
    }

}
