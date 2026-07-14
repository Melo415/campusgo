package com.hmdp.controller;

import com.baomidou.mybatisplus.extension.conditions.query.QueryChainWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.hmdp.dto.Result;
import com.hmdp.dto.UserDTO;
import com.hmdp.entity.Blog;
import com.hmdp.entity.User;
import com.hmdp.service.IBlogService;
import com.hmdp.service.IUserService;
import com.hmdp.utils.AliOSSUtils;
import com.hmdp.utils.SystemConstants;
import com.hmdp.utils.UserHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

import static com.hmdp.utils.RedisConstants.BLOG_HOT_KEY;

/**
 * <p>
 * 前端控制器
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
@Slf4j
@RestController
@RequestMapping("/blog")
public class BlogController {

    @Resource
    private IBlogService blogService;

    @Resource
    private AliOSSUtils aliOSSUtils;

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @PostMapping("/upload")
    public Result uploadImages(@RequestParam("files") MultipartFile[] files) {
        // 1. 验证文件是否为空
        if (files == null || files.length == 0) {
            return Result.fail("请选择要上传的图片");
        }

        // 2. 验证文件大小和格式
        for (MultipartFile file : files) {
            // 2.1 验证文件大小（限制为2MB）
            if (file.getSize() > 2 * 1024 * 1024) {
                return Result.fail("图片大小不能超过2MB");
            }

            // 2.2 验证文件类型
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return Result.fail("只能上传图片文件");
            }

            // 2.3 验证文件格式
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                return Result.fail("文件格式错误");
            }
            String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
            if (!suffix.equalsIgnoreCase(".jpg") &&
                !suffix.equalsIgnoreCase(".jpeg") &&
                !suffix.equalsIgnoreCase(".png") &&
                !suffix.equalsIgnoreCase(".gif")) {
                return Result.fail("只支持jpg、jpeg、png、gif格式的图片");
            }
        }

        // 3. 上传图片到OSS
        List<String> imageUrls = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                String url = aliOSSUtils.upload(file);
                imageUrls.add(url);
            }
            return Result.ok(imageUrls);
        } catch (Exception e) {
            log.error("图片上传失败", e);
            return Result.fail("图片上传失败：" + e.getMessage());
        }
    }

    @PostMapping
    public Result saveBlog(@RequestBody Blog blog) {
        return blogService.saveBlog(blog);
    }

    @GetMapping("/of/follow")
    public Result queryBlogOfFollow(
            @RequestParam("lastId") Long max,
            @RequestParam(value = "offset",defaultValue ="0") Integer offset){

        return blogService.queryBlogOfFollow(max,offset);
    }

    /**
     * 名字为查询热点博客 但是实际为首页展示所有博客 按照创建时间排序
     * @param
     * @return
     */

    @GetMapping("/hot")
    public Result queryHotBlog(@RequestParam("lastScore") Long lastScore) {


        return blogService.queryHotBlog(lastScore);

    }


    @PutMapping("/like/{id}")
    public Result likeBlog(@PathVariable("id") Long id) {

        return blogService.likeBlog(id);
    }

    @GetMapping("/of/me")
    public Result queryMyBlog(@RequestParam(value = "current", defaultValue = "1") Integer current) {
        // 获取登录用户
        UserDTO user = UserHolder.getUser();
        // 根据用户查询
        Page<Blog> page = blogService.query()
                .eq("user_id", user.getId()).page(new Page<>(current, SystemConstants.MAX_PAGE_SIZE));
        // 获取当前页数据
        List<Blog> records = page.getRecords();
        return Result.ok(records);
    }


    /*@GetMapping("/hot")
    public Result queryHotBlog(@RequestParam(value = "current", defaultValue = "1") Integer current) {

        return blogService.queryHotBlog(current);

    }*/
    @GetMapping("/{id}")
    public Result queryBlogById(@PathVariable("id") Long id) {
        return blogService.queryBlogById(id);
    }


    @GetMapping("likes/{id}")
    public Result queryBlogLikes(@PathVariable("id") Long id){

        return blogService.queryBlogLikes(id);
    }

    @GetMapping("/of/user")
    public Result queryBlogByUserId(
            @RequestParam(value ="current",defaultValue = "1") Integer current,
            @RequestParam("id") Long id){

        Page<Blog> page = blogService.query()
                .eq("user_id", id)
                .orderByDesc("create_time")
                .page(new Page<>(current, SystemConstants.MAX_PAGE_SIZE));

        List<Blog> records =page.getRecords();

        return Result.ok(records);
    }

    @DeleteMapping("/{id}")
    public Result deleteBlog(@PathVariable("id") Long id) {
        // 1.获取登录用户
        UserDTO user = UserHolder.getUser();
        if (user == null) {
            return Result.fail("未登录");
        }

        // 2.查询笔记是否存在
        Blog blog = blogService.getById(id);
        if (blog == null) {
            return Result.fail("笔记不存在");
        }

        // 3.验证是否是笔记作者
        if (!blog.getUserId().equals(user.getId())) {
            return Result.fail("无权限删除他人笔记");
        }

        // 4.删除笔记
        boolean success = blogService.removeById(id);
        if (success) {
            // 5. 同步删除 Redis ZSet 里的博客ID
            String key = BLOG_HOT_KEY;
            stringRedisTemplate.opsForZSet().remove(key, id.toString());
            return Result.ok();
        } else {
            return Result.fail("删除失败");
        }
    }

}
