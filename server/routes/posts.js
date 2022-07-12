const express = require("express");
const postControllers = require("../controllers/posts");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, postControllers.getPosts);
router.get("/tags/:tags", authenticateToken, postControllers.getPostsByTags);
router.get("/:postId", authenticateToken, postControllers.getPost);
router.post("/", authenticateToken, postControllers.createPost);
router.get(
  "/user/liked/posts/all",
  authenticateToken,
  postControllers.getLikedPosts
);
router.get("/:userId/posts", authenticateToken, postControllers.getUserPosts);
router.get(
  "/:userId/posts/:page",
  authenticateToken,
  postControllers.getUserPostsByPage
);
router.get(
  "/user/following/list/posts",
  authenticateToken,
  postControllers.getFollowingPosts
);
router.post("/like/:postId", authenticateToken, postControllers.likePost);
router.delete("/like/:postId", authenticateToken, postControllers.unlikePost);
router.delete("/:postId", authenticateToken, postControllers.deletePost);
router.post(
  "/:postId/comment",
  authenticateToken,
  postControllers.commentOnPost
);
router.delete(
  "/comments/:commentId",
  authenticateToken,
  postControllers.deleteComment
);
router.post(
  "/comments/:commentId/like",
  authenticateToken,
  postControllers.likeComment
);
router.delete(
  "/comments/:commentId/like",
  authenticateToken,
  postControllers.unlikeComment
);
router.get(
  "/comments/:commentId",
  authenticateToken,
  postControllers.getComment
);
router.get("/:postId/comments", authenticateToken, postControllers.getComments);

module.exports = router;
