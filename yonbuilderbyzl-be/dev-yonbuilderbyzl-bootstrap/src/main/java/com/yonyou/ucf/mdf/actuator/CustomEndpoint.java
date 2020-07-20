//package com.yonyou.ucf.mdf.actuator;
//
//import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
//import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
//import org.springframework.boot.actuate.endpoint.annotation.Selector;
//import org.springframework.stereotype.Component;
//
//import java.util.Collections;
//import java.util.List;
//
//@Endpoint(id = "custom")
//@Component
//public class CustomEndpoint {
//
//    // response header  Content-Type:	application/vnd.spring-boot.actuator.v2+json;charset=UTF-8
//
//    //@ReadOperation
//    // some method like this    =>  public List<?> getAll(){ return ...}
//    // or some method like this =>  public Object getPerson(@Selector String name) {return ...}
//
//    //@WriteOperation
//    // some method like this    =>  public void addOrUpdatePerson(@Selector String name, @Selector String person) { return ...}
//
//    @ReadOperation
//    public List<String> show(@Selector String name){
//        return Collections.singletonList(String.format("Hi, %s . It's a find day, isn't it ?", name));
//    }
//}
