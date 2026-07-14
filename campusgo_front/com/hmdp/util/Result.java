package com.hmdp.util;

import lombok.Data;

@Data
public class Result {
    private Boolean success;
    private String message;
    private Object data;

    public static Result ok() {
        Result result = new Result();
        result.setSuccess(true);
        return result;
    }

    public static Result ok(Object data) {
        Result result = new Result();
        result.setSuccess(true);
        result.setData(data);
        return result;
    }

    public static Result fail(String message) {
        Result result = new Result();
        result.setSuccess(false);
        result.setMessage(message);
        return result;
    }
} 