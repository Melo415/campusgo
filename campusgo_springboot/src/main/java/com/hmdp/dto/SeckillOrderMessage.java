package com.hmdp.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class SeckillOrderMessage implements Serializable {
    private Long userId;
    private Long voucherId;
    private Long orderId;
}