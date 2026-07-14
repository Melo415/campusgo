package com.hmdp.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.BooleanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.hmdp.dto.Result;
import com.hmdp.dto.ScrollResult;
import com.hmdp.dto.UserDTO;
import com.hmdp.entity.Blog;
import com.hmdp.entity.Follow;
import com.hmdp.entity.User;
import com.hmdp.mapper.BlogMapper;
import com.hmdp.service.IBlogService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hmdp.service.IFollowService;
import com.hmdp.service.IUserService;
import com.hmdp.utils.SnowflakeIdWorker;
import com.hmdp.utils.SystemConstants;
import com.hmdp.utils.UserHolder;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.stream.Collectors;

import static com.hmdp.utils.RedisConstants.*;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
@Service
public class BlogServiceImpl extends ServiceImpl<BlogMapper, Blog> implements IBlogService {

    @Resource
    private IUserService userService;

    @Resource
    private IFollowService followService;

    @Resource
    private StringRedisTemplate stringRedisTemplate;



    /**
     * 保存文章
     * @param blog
     * @return
     */
    @Override
    public Result saveBlog(Blog blog) {
        // 1. 获取登录用户
        UserDTO user = UserHolder.getUser();
        blog.setUserId(user.getId());

        // 2. 处理图片URL
        String images = blog.getImages();
        if (StrUtil.isNotBlank(images)) {
            // 如果图片URL已经是阿里云OSS的URL，则直接使用
            // 如果是本地路径，需要转换为阿里云OSS的URL
            if (!images.startsWith("http")) {
                // 使用正确的OSS地址
                blog.setImages(images.replaceAll("^/upload/", "https://xder-dianping.oss-cn-beijing.aliyuncs.com/"));
            }
        }

        // 3. 保存博客到数据库
        boolean isSaved = save(blog);
        if (!isSaved) {
            return Result.fail("保存博客失败");
        }

        // 4. 使用随机分数作为排序依据
        long score = (long) (System.currentTimeMillis() + (Math.random() * 1000));

        // 5. 将博客 ID 存储到 Redis 的有序集合中
        String key = BLOG_HOT_KEY;
        stringRedisTemplate.opsForZSet().add(key, blog.getId().toString(), score);

        // 6. 查询笔记作者的所有粉丝
        List<Follow> follows = followService.query().eq("follow_user_id", user.getId()).list();

        // 7. 推送笔记id给所有粉丝
        for (Follow follow : follows) {
            Long userId = follow.getUserId();
            String key1 = FEED_KEY + userId;
            stringRedisTemplate.opsForZSet().add(key1, blog.getId().toString(), System.currentTimeMillis());
        }

        // 8. 返回id
        return Result.ok(blog.getId());
    }

    /**
     * 首页按照时间顺序排序  查询博客 滚动分页查询
     * @param lastScore
     * @return
     */
    @Override
    public Result queryHotBlog(Long lastScore) {
        // 1. 定义 Redis 键
        String key = "blog:hot";

        // 2. 从 Redis 中查询博客 ID，按分数降序排列
        Set<ZSetOperations.TypedTuple<String>> typedTuples = stringRedisTemplate.opsForZSet()
                .reverseRangeByScoreWithScores(key, 0, lastScore, 0, 10);

        // 3. 非空判断
            if (typedTuples == null || typedTuples.isEmpty()) {
            return Result.ok(Collections.emptyList());
        }

        // 4. 解析数据：获取博客 ID 列表
        List<Long> ids = new ArrayList<>(typedTuples.size());
        long newLastScore = 0;
        for (ZSetOperations.TypedTuple<String> tuple : typedTuples) {
            // 获取博客 ID
            String idStr = tuple.getValue();
            ids.add(Long.valueOf(idStr));
            // 获取分数
            newLastScore = tuple.getScore().longValue();
        }

        // 5. 根据 ID 查询博客
        String idStr = StrUtil.join(",", ids);
        List<Blog> blogs = query().in("id", ids).last("ORDER BY FIELD(id," + idStr + ")").list();

        // 6. 查询用户信息和点赞状态
        blogs.forEach(blog -> {
            queryBlogUser(blog);
            isBlogLiked(blog);
        });


        // 7. 封装结果
        ScrollResult result = new ScrollResult();
        result.setList(blogs);
        result.setMinTime(newLastScore-2); // 减去一个增量
        return Result.ok(result);
    }

    /**
     * 查询收件箱里面的所有笔记 ， 进行分页滚动查询
     * @param max
     * @param offset
     * @return
     */
    @Override
    public Result queryBlogOfFollow(Long max, Integer offset) {
        // 1 . 获取当前用户
        Long userId = UserHolder.getUser().getId();


        // 2 . 查询收件箱 ZREVRANGEBYSCORE key Max Min LIMIT offset count
        String key = FEED_KEY + userId ;
        Set<ZSetOperations.TypedTuple<String>> typedTuples = stringRedisTemplate.opsForZSet()
                .reverseRangeByScoreWithScores(key, 0 , max, offset, 2) ;

        // 3 . 非空判断
        if(typedTuples == null || typedTuples.isEmpty()){
            return Result.ok() ;
        }

        // 4 . 解析数据 : blogId , minTime , offset
        List<Long> ids = new ArrayList<>(typedTuples.size()) ;

        long minTime = 0 ;
        int os = 1 ;
        for(ZSetOperations.TypedTuple<String> tuple : typedTuples){
            // 4 . 1获取id ;
            String idStr = tuple.getValue() ;
            ids.add(Long.valueOf(idStr)) ;
            // 4 . 2 获取分数(时间戳)
            long time = tuple.getScore().longValue() ;
            if(time == minTime){
                os ++ ;
            }else{
                minTime = time ;
                os = 1 ;
            }
        }



        // 5 . 根据id查询blog
        String idStr = StrUtil.join(",", ids);
        List<Blog> blogs = query().in("id", ids).last("ORDER BY FIELD(id," + idStr + ")").list();

        for (Blog blog : blogs) {
            // 5 . 1 查询blog有关的用户
            queryBlogUser(blog);
            // 5 . 2 查询blog是否被点赞
            isBlogLiked(blog) ;
        }

        // 6 . 封装并返回
        ScrollResult r = new ScrollResult();
        r.setList(blogs);
        r.setOffset(os);
        r.setMinTime(minTime);

        return Result.ok(r);
    }

/*    @Override
    public Result queryHotBlog(Integer current) {

        // 根据用户查询
       *//* Page<Blog> page = query()
                .orderByDesc("liked")
                .page(new Page<>(current, SystemConstants.MAX_PAGE_SIZE));*//*
        //按照发布时间排序
        Page<Blog> page = query()
                .orderByDesc("update_time")
                .page(new Page<>(current, SystemConstants.MAX_PAGE_SIZE));


        // 获取当前页数据
        List<Blog> records = page.getRecords();

        // 查询用户
        records.forEach(blog -> {

            this.queryBlogUser(blog);
            this.isBlogLiked(blog);
        });
        return Result.ok(records);

    }*/

    @Override
    public Result queryBlogById(Long id) {

        Blog blog=getById(id);
        if(blog==null){
            return Result.fail("笔记不存在！");
        }

        queryBlogUser(blog);
        isBlogLiked(blog);
        return Result.ok(blog);

    }

    private void isBlogLiked(Blog blog) {

        UserDTO user = UserHolder.getUser();

        if(user==null){

            return;
        }

        Long userId= user.getId();

        String key=BLOG_LIKED_KEY+blog.getId();

        Double score = stringRedisTemplate.opsForZSet().score(key, userId.toString());

        blog.setIsLike(score!=null);
    }

    @Override
    public Result queryBlogLikes(Long id) {
        String key=BLOG_LIKED_KEY+id;

        Set<String> top5 = stringRedisTemplate.opsForZSet().range(key, 0, 4);

        if(top5==null||top5.isEmpty()){
            return Result.ok(Collections.emptyList());
        }

        List<Long> ids=top5.stream().map(Long ::valueOf).collect(Collectors.toList());

        String idStr= StrUtil.join(",",ids);
        //根据id查询用户 Where id IN( 5,1) order by field (id,5,1)

        List<UserDTO> userDTOS=userService.query()
                .in("id",ids).last("ORDER BY FIELD(id," + idStr + ")").list()
                .stream()
                .map(user-> BeanUtil.copyProperties(user,UserDTO.class))
                .collect(Collectors.toList());

        return Result.ok(userDTOS);


    }

    @Override
    public Result likeBlog(Long id) {

        Long userId= UserHolder.getUser().getId();

        String key=BLOG_LIKED_KEY+id;

        Double score = stringRedisTemplate.opsForZSet().score(key, userId.toString());


        if(score==null){

            //未点赞
            boolean isSuccess = update().setSql("liked = liked + 1").eq("id", id).update();

            if(isSuccess){
                stringRedisTemplate.opsForZSet().add(key,userId.toString(),System.currentTimeMillis());
            }
        }else {

            boolean isSuccess = update().setSql("liked = liked - 1").eq("id", id).update();
            if(isSuccess){

                stringRedisTemplate.opsForZSet().remove(key,userId.toString());
            }

        }

        return Result.ok();

    }

    private void queryBlogUser(Blog blog) {
        Long userId= blog.getUserId();
        User user=userService.getById(userId);
        if (user != null) {
            blog.setName(user.getNickName());
            blog.setIcon(user.getIcon());
        } else {
            // 可以根据业务需求进行处理，比如设置默认值或者记录日志
            blog.setName("未知用户");
            blog.setIcon("");
        }
    }
}
