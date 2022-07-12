const express = require("express");
const userControllers = require("../controllers/users");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/token", userControllers.getAccessToken);
router.get(
  "/:username/info",
  authenticateToken,
  userControllers.getUserFromUsername
);
router.get("/:userId/username", authenticateToken, userControllers.getUsername);
router.get("/find/:searchTerm", authenticateToken, userControllers.findUsers);
router.post("/login", userControllers.login);
router.post("/logout", authenticateToken, userControllers.logout);
router.get("/self", authenticateToken, userControllers.getSelf);
router.get("/", authenticateToken, userControllers.getUsers);
router.get("/:userId", authenticateToken, userControllers.getUser);
router.post("/", userControllers.createUser);
router.patch("/", authenticateToken, userControllers.updateUser);
router.delete("/delete", authenticateToken, userControllers.deleteUser);
router.post(
  "/follow/:idToFollow",
  authenticateToken,
  userControllers.followUser
);
router.delete(
  "/follow/:idToUnfollow",
  authenticateToken,
  userControllers.unfollowUser
);
router.post(
  "/block/:idToBlock",
  authenticateToken,
  userControllers.blockUser
);
router.delete(
  "/block/:idToUnblock",
  authenticateToken,
  userControllers.unblockUser
);

module.exports = router;
