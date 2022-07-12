const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const GoodToken = require("../models/GoodToken");

const {
  TOKEN_EXPIRATION_MINUTES,
  TOKEN_EXPIRATION_MILLISECONDS,
} = require("../constants/authConstants");

// function to generate an access token
const generateAccessToken = async ({ id }) => {
  try {
    // generate a new access token and set to expire in 10 minutes
    const token = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: TOKEN_EXPIRATION_MINUTES,
    });
    // save token to whitelist in db
    const goodToken = new GoodToken({
      token,
      user: id,
      expiresAt: Date.now() + TOKEN_EXPIRATION_MILLISECONDS,
    });

    await goodToken.save();
    return token;
  } catch (error) {
    console.log(error);
  }
};

// @desc Generate a new access token from a refresh token
// @route POST /api/users/token
// @access Public
const getAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token" });
    }
    const user = await User.findOne({ refreshToken });
    if (!user)
      return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, user) => {
        if (err)
          return res.status(403).json({ message: "Invalid refresh token" });

        const accessToken = await generateAccessToken({ id: user.id });
        res.status(200).json({ accessToken });
      }
    );
  } catch (error) {
    console.log(error);
  }
};

// @desc Return a user's data from their username
// @route GET /api/users/:username/info
// @access Private
const getUserFromUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select([
      "-password",
      "-refreshToken",
    ]);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(200).json(user);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Return a user's username from their id
// @route GET /api/users/:userId/username
// @access Private
const getUsername = async (req, res) => {
  try {
    const username = await User.findById(req.params.userId).select("username");
    if (!username) {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(200).json({ username: username.username });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Return users that match the username search
// @route GET /api/users/find/:searchTerm
// @access Private
const findUsers = async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { username: { $regex: req.params.searchTerm, $options: "i" } },
        {
          username: {
            $regex: `^${req.params.searchTerm}`,
            $options: "i",
          },
        },
      ],
    }).select(["-password", "-refreshToken"]);
    if (users.length === 0) {
      res.status(404).json({ message: "No users found" });
    } else {
      res.status(200).json(users);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login a user and return an access and refresh token
// @route POST /api/users/login
// @access Public
const login = async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      res
        .status(400)
        .json({ message: "Please provide a username and password" });
      return;
    }

    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      res.status(404).json({ message: "Incorrect username" });
    } else if (user.refreshToken) {
      res.status(403).json({ message: "User already logged in" });
    } else {
      const match = await bcrypt.compare(req.body.password, user.password);
      if (match) {
        const accessToken = await generateAccessToken({ id: user._id });
        const refreshToken = jwt.sign(
          { id: user._id },
          process.env.REFRESH_TOKEN_SECRET
        );

        // store the refresh token in the database
        await User.findByIdAndUpdate(user._id, {
          refreshToken,
        });

        res.status(200).json({ id: user._id, accessToken, refreshToken });
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Logout a user (remove their refresh token)
// @route POST /api/users/logout
// @access Private
const logout = async (req, res) => {
  try {
    // remove the refresh token from the database
    const user = await User.findByIdAndUpdate(req.userId, {
      refreshToken: "",
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      // remove user's access tokens from the whitelist
      const tokens = await GoodToken.find({ userId: user._id });
      for (const token of tokens) {
        await GoodToken.deleteOne({ _id: token._id });
      }
      res.status(200).json({ message: "User logged out" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Return info about self based on passed token
// @route GET /api/users/self
// @access Private
const getSelf = async (req, res) => {
  try {
    if (!req.userId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const user = await User.findById(req.userId).select([
      "-_id",
      "-password",
      "-__v",
      "-refreshToken",
    ]);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Return all users
// @route GET /api/users
// @access Private
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select(["-password", "-refreshToken"]);
    if (users.length === 0) {
      res.status(404).json({ message: "No users found" });
    } else {
      res.status(200).json(users);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Return a user's data from their id
// @route GET /api/users/:userId
// @access Private
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select([
      "-password",
      "-refreshToken",
      "-likedPosts",
      "-__v",
      "-email",
    ]);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(200).json(user);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a new user and return an access and refresh token
// @route POST /api/users
// @access Public
const createUser = async (req, res) => {
  try {
    if (
      !req.body.username ||
      !req.body.password ||
      !req.body.email ||
      !req.body.name
    ) {
      res.status(400).json({ message: "Missing required fields" });
    } else {
      // find user by username or email
      const user = await User.findOne({
        $or: [{ username: req.body.username }, { email: req.body.email }],
      });
      if (user) {
        res.status(409).json({ message: "User already exists" });
      } else {
        const user = new User(req.body);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        user.password = hashedPassword;
        const accessToken = generateAccessToken({ id: user._id });
        const refreshToken = jwt.sign(
          { id: user._id },
          process.env.REFRESH_TOKEN_SECRET
        );
        // store the refresh token in the database
        user.refreshToken = refreshToken;

        await user.save();

        res.status(200).json({ id: user._id, accessToken, refreshToken });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update a user's data
// @route PATCH /api/users/
// @access Private
const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.userId, req.body, {
      new: true,
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      if (req.body.password) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
      }
      await user.save();
      res.status(200).json(user);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
};

// @desc Delete a user
// @route DELETE /api/users/delete
// @access Private
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(200).json({ message: "User deleted" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Follow another user
// @route POST /api/users/follow/:idToFollow
// @access Private
const followUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.idToFollow);
    const follower = await User.findById(req.userId);
    if (req.params.idToFollow === req.userId) {
      res.status(400).json({ message: "You can't follow yourself" });
    } else if (user.blocked.includes(req.userId)) {
      res
        .status(400)
        .json({ message: "Cannot follow, the user has blocked you" });
    } else if (follower.following.includes(req.params.idToFollow)) {
      res.status(400).json({ message: "You are already following this user" });
    } else if (follower.blocked.includes(req.params.idToFollow)) {
      res.status(400).json({ message: "You can't follow a blocked user" });
    } else {
      user.followers.push(req.userId);
      follower.following.push(req.params.idToFollow);
      await user.save();
      await follower.save();
      res.status(200).json({ message: "User followed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Unfollow another user
// @route DELETE /api/users/follow/:idToUnfollow
// @access Private
const unfollowUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.idToUnfollow);
    const unfollower = await User.findById(req.userId);
    if (!user || !unfollower) {
      res.status(404).json({ message: "Users not found" });
    } else if (req.params.idToUnfollow === req.userId) {
      res.status(400).json({ message: "You can't unfollow yourself" });
    } else if (!user.followers.includes(req.userId)) {
      res.status(400).json({ message: "You are not following this user" });
    } else {
      user.followers.splice(user.followers.indexOf(req.userId), 1);
      unfollower.following.splice(
        unfollower.following.indexOf(req.params.idToUnfollow),
        1
      );
      await user.save();
      await unfollower.save();
      res.status(200).json({ message: "User unfollowed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Block another user
// @route POST /api/users/block/:idToBlock
// @access Private
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else if (req.userId === req.params.idToBlock) {
      res.status(400).json({ message: "You can't block yourself" });
    } else {
      const blockedUser = await User.findById(req.params.idToBlock);
      if (!blockedUser) {
        res.status(404).json({ message: "User not found" });
      } else if (user.blocked.includes(req.params.idToBlock)) {
        res.status(400).json({ message: "You are already blocking this user" });
      } else {
        user.blocked.push(req.params.idToBlock);
        if (blockedUser.followers.includes(req.userId)) {
          blockedUser.followers.splice(
            blockedUser.followers.indexOf(req.userId),
            1
          );
          user.following.splice(
            user.following.indexOf(req.params.idToBlock),
            1
          );
        }
        if (blockedUser.following.includes(req.userId)) {
          blockedUser.following.splice(
            blockedUser.following.indexOf(req.userId),
            1
          );
          user.followers.splice(
            user.followers.indexOf(req.params.idToBlock),
            1
          );
        }

        await user.save();
        await blockedUser.save();

        res.status(200).json({ message: "User blocked" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Unblock another user
// @route DELETE /api/users/block/:idToUnblock
// @access Private
const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else if (req.userId === req.params.idToUnblock) {
      res.status(400).json({ message: "You can't unblock yourself" });
    } else if (!user.blocked.includes(req.params.idToUnblock)) {
      res.status(400).json({ message: "You have not blocked this user" });
    } else {
      user.blocked.splice(user.blocked.indexOf(req.params.idToUnblock), 1);
      await user.save();
      res.status(200).json({ message: "User unblocked" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAccessToken,
  getUserFromUsername,
  getUsername,
  findUsers,
  login,
  logout,
  getSelf,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
};
