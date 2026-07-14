package com.hmdp.dto;

import lombok.Data;

@Data
public class ShopCommentDTO {
    private Long shopId;
    private Long parentId;
    private Long answerId;
    private String content;
}
