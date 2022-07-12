const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const PAGE_LIMIT = 10;

// @desc Get all posts
// @route GET /api/posts
// @access Private
const getPosts = async (req, res) => {
  try {
    // order by most recent
    const posts = await Post.find();
    if (!posts) {
      res.status(404).json({ message: "No posts found" });
    } else {
      res.status(200).json(posts.reverse());
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get posts by tag(s)
// @route GET /api/posts/tags
// @access Private
const getPostsByTags = async (req, res) => {
  try {
    const posts = await Post.find({
      tags: {
        $in: req.params.tags.split(","),
      },
    })
      .populate("user", "_id username")
      .exec();
    res.status(200).json(posts.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get post by id
// @route GET /api/posts/:postId
// @access Private
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
    } else {
      res.status(200).json(post);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get a user's posts
// @route GET /api/posts/:userId/posts
// @access Private
const getUserPosts = async (req, res) => {
  try {
    if (!req.params.userId) {
      res.status(400).json({ message: "User id is required" });
      return;
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      const posts = [];
      for (let i = 0; i < user.posts.length; i++) {
        const post = await Post.findById(user.posts[i])
          .populate("user", "_id username")
          .exec();
        if (post) {
          posts.push(post);
        }
      }
      res.status(200).json(posts.reverse());
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get a user's posts
// @route GET /api/posts/user/liked/posts/all
// @access Private
const getLikedPosts = async (req, res) => {
  try {
    if (!req.userId) {
      res.status(400).json({ message: "User id is required" });
      return;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      const posts = [];
      for (let i = 0; i < user.likedPosts.length; i++) {
        const post = await Post.findById(user.likedPosts[i])
          .populate("user", "_id username")
          .exec();
        if (post) {
          posts.push(post);
        }
      }
      res.status(200).json(posts.reverse());
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get a user's posts
// @route GET /api/posts/:userId/posts/:page
// @access Private
const getUserPostsByPage = async (req, res) => {
  try {
    if (!req.params.userId) {
      res.status(404).json({ message: "User id is required" });
      return;
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      const posts = [];
      let i = (req.params.page - 1) * PAGE_LIMIT;
      while (posts.length < user.posts.length && posts.length < PAGE_LIMIT) {
        if (i >= user.posts.length) {
          break;
        }
        const post = await Post.findById(user.posts[i]);
        if (post) {
          posts.push(post);
        } else {
          throw new Error("Deleted post not deleted from the user's posts");
        }
        i++;
      }

      if (posts.length === 0) {
        res.status(404).json({ message: "No posts found" });
        return;
      }

      res.status(200).json(posts.reverse());
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get posts of followed users
// @route GET /api/posts//user/following/list/posts
// @access Private
const getFollowingPosts = async (req, res) => {
  try {
    if (!req.userId) {
      res.status(404).json({ message: "User id is required" });
      return;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      const posts = [];
      for (let i = 0; i < user.following.length; i++) {
        const following = await User.findById(user.following[i]);
        for (let j = 0; j < following.posts.length; j++) {
          posts.push(
            await Post.findById(following.posts[j])
              .populate("user", "_id username")
              .exec()
          );
        }
      }
      // add posts from user
      for (let i = 0; i < user.posts.length; i++) {
        posts.push(
          await Post.findById(user.posts[i])
            .populate("user", "_id username")
            .exec()
        );
      }
      // order by most recent
      posts.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      res.status(200).json(posts);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a post
// @route POST /api/posts
// @access Private
const createPost = async (req, res) => {
  try {
    if (!req.body.userId) {
      res.status(400).json({ message: "User id is required" });
      return;
    }
    const user = await User.findById(req.body.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      const post = new Post(req.body.post);
      post.user = req.body.userId;
      user.posts.push(post);
      await post.save();
      await user.save();
      res.status(201).json(post);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Like a post
// @route POST /api/posts/like/:postId
// @access Private
const likePost = async (req, res) => {
  try {
    if (!req.params.postId) {
      res.status(400).json({ message: "Post id not provided" });
      return;
    }
    if (!req.userId) {
      res.status(400).json({ message: "User id not provided" });
      return;
    }
    const post = await Post.findById(req.params.postId);
    const user = await User.findById(req.userId);
    if (!post || !user) {
      res.status(404).json({ message: "Post or user not found" });
      return;
    }
    if (!post.likes.includes(req.userId)) {
      post.likes.push(req.userId);
      user.likedPosts.push(req.params.postId);
      await post.save();
      await user.save();
      res.status(200).json(post);
    } else {
      res.status(400).json({ message: "Post already liked" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Unlike a post
// @route DELETE /api/posts/like/:postId
// @access Private
const unlikePost = async (req, res) => {
  try {
    if (!req.params.postId) {
      res.status(400).json({ message: "Post id not provided" });
      return;
    }
    if (!req.userId) {
      res.status(400).json({ message: "User id not provided" });
      return;
    }
    const post = await Post.findById(req.params.postId);
    const user = await User.findById(req.userId);
    if (!post || !user) {
      res.status(404).json({ message: "Post or user not found" });
      return;
    }
    if (post.likes.includes(req.userId)) {
      post.likes.splice(post.likes.indexOf(req.userId), 1);
      user.likedPosts.splice(user.likedPosts.indexOf(req.params.postId), 1);
      await post.save();
      await user.save();
      res.status(200).json(post);
    } else {
      res.status(400).json({ message: "User has not liked this post" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a post
// @route DELETE /api/posts/:postId
// @access Private
const deletePost = async (req, res) => {
  try {
    if (!req.userId) {
      res.status(400).json({ message: "User id is required" });
      return;
    }
    if (!req.params.postId) {
      res.status(400).json({ message: "Post id is required" });
      return;
    }
    const post = await Post.findById(req.params.postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
    } else {
      const user = await User.findById(req.userId);
      user.posts.splice(user.posts.indexOf(req.params.postId), 1);
      await post.remove();
      await user.save();
      res.status(200).json({ message: "Post deleted" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Comment on a post
// @route POST /api/posts/:postId/comment/
// @access Private
const commentOnPost = async (req, res) => {
  try {
    if (!req.userId) {
      res.status(400).json({ message: "User id is required" });
      return;
    }
    if (!req.params.postId) {
      res.status(400).json({ message: "Post id is required" });
      return;
    }
    const post = await Post.findById(req.params.postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
    } else {
      const userComment = {
        user: req.userId,
        post: req.params.postId,
        text: req.body.comment,
      };
      const comment = new Comment(userComment);
      post.comments.push(comment);
      await comment.save();
      await post.save();
      res.status(201).json(comment);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a comment
// @route DELETE /api/posts/comments/:commentId
// @access Private
const deleteComment = async (req, res) => {
  try {
    if (!req.params.commentId) {
      res.status(400).json({ message: "Comment id is required" });
      return;
    }
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
    } else {
      const post = await Post.findById(comment.post);
      if (!post) {
        res.status(404).json({ message: "Post not found" });
      } else {
        post.comments.splice(post.comments.indexOf(req.params.commentId), 1);
        await comment.remove();
        await post.save();
        res.status(200).json(post);
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Like a comment
// @route POST /api/posts/comments/:commentId/like
// @access Private
const likeComment = async (req, res) => {
  try {
    if (!req.userId) {
      res.status(400).json({ message: "User id is required" });
      return;
    }
    if (!req.params.commentId) {
      res.status(400).json({ message: "Comment id is required" });
      return;
    }
    const comment = await Comment.findById(req.params.commentId);
    if (!comment.likes.includes(req.userId)) {
      comment.likes.push(req.userId);
      await comment.save();
      res.status(200).json(comment);
    } else {
      res.status(400).json({ message: "Comment already liked" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Unlike a comment
// @route DELETE /api/posts/comments/:commentId/like/
// @access Private
const unlikeComment = async (req, res) => {
  try {
    if (!req.userId) {
      res.status(400).json({ message: "User id is required" });
      return;
    }
    if (!req.params.commentId) {
      res.status(400).json({ message: "Comment id is required" });
      return;
    }
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      res.status(400).json({ message: "Comment not found" });
    } else {
      if (comment.likes.includes(req.userId)) {
        comment.likes.splice(comment.likes.indexOf(req.userId), 1);
        await comment.save();
        res.status(200).json(comment);
      } else {
        res.status(400).json({ message: "User has not liked this comment" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get a comment by id
// @route GET /api/posts/comments/:commentId
// @access Private
const getComment = async (req, res) => {
  try {
    if (!req.params.commentId) {
      res.status(400).json({ message: "Comment id is required" });
      return;
    }
    // get user's username and id from comment, need to do a join
    const comment = await Comment.findById(req.params.commentId)
      .populate("user", "_id username")
      .exec();
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
    } else {
      res.status(200).json(comment);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all comments on a post
// @route GET /api/posts/:postId/comments
// @access Private
const getComments = async (req, res) => {
  try {
    if (!req.params.postId) {
      res.status(400).json({ message: "Post id is required" });
      return;
    }
    const post = await Post.findById(req.params.postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
    } else {
      const comments = [];
      for (let i = 0; i < post.comments.length; i++) {
        const comment = await Comment.findById(post.comments[i])
          .populate("user", "_id username")
          .exec();
        comments.push(comment);
      }
      res.status(200).json(comments);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPosts,
  getPostsByTags,
  getPost,
  getUserPosts,
  getLikedPosts,
  getUserPostsByPage,
  getFollowingPosts,
  createPost,
  likePost,
  unlikePost,
  deletePost,
  commentOnPost,
  deleteComment,
  likeComment,
  unlikeComment,
  getComment,
  getComments,
};
