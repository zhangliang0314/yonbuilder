package com.yonyou.ucf.mdf.app.mobile.web.controller.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommonResponse {

    private String message;
    private String code;

    /**
     * 200 success
     */
    private Boolean success;

    private Object data;

    public static CommonResponse success() {
        return new CommonResponse(null, null, true, null);
    }

    public static CommonResponse noOp() {
        return new CommonResponse(null, "NO_OPERATION", true, null);
    }

    public static CommonResponse success(Object data) {
        return new CommonResponse(null, null, false, data);
    }

    public static CommonResponse failed(String message, String code) {
        return new CommonResponse(message, code, false, null);
    }

}
