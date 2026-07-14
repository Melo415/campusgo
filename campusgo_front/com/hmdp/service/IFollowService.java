package com.hmdp.service;

import com.hmdp.dto.Result;

public interface IFollowService {
    Result follow(Long followUserId, Boolean isFollow);
    
    Result isFollow(Long followUserId);
    
    Result followCommons(Long id);

    Result queryFollowings();
} 