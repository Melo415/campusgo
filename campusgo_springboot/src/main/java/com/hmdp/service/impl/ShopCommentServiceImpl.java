package com.hmdp.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hmdp.entity.ShopComment;
import com.hmdp.mapper.ShopCommentMapper;
import com.hmdp.service.IShopCommentService;
import org.springframework.stereotype.Service;

@Service
public class ShopCommentServiceImpl extends ServiceImpl<ShopCommentMapper, ShopComment> implements IShopCommentService {
    // 可扩展自定义方法
}
