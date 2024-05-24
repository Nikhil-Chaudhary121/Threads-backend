import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generatTokenAndSetCookie from "../utils/helper/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const getUserProfile = async (req, res) => {
  try {
    // query can be username and userId
    let user;
    const { query } = req.params;
    // console.log(query, mongoose.Types.ObjectId.isValid(query));

    if (mongoose.Types.ObjectId.isValid(query)) {
      user = await User.findById(query)
        .select("-password")
        .select("-updatedAt");
    } else {
      user = await User.findOne({ username: query })
        .select("-password")
        .select("-updatedAt");
    }

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in getUserProfile: ${err.message}`);
  }
};

const signUpUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save();

    if (newUser) {
      const token = generatTokenAndSetCookie(newUser._id, res);
      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        bio: newUser.bio || "",
        profilePic: newUser.profilePic || "",
        // token: token,
      });
    } else {
      res.status(400).json({ error: "Invalid User Data" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in signUpUser: ${err.message}`);
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password" });
    }
    const token = generatTokenAndSetCookie(user._id, res);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
      // token: token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in loginUser: ${err.message}`);
  }
};

const logoutUser = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 1 });
    res.status(200).json({ message: "Successfully logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in loginUser: ${err.message}`);
  }
};

const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }
    if (!userToModify || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      //UnFollow the user
      //Modify Current User following , modify followers of userModify
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      res.status(200).json({ message: "Successfully unfollowed" });
    } else {
      //Follow the user
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      res.status(200).json({ message: "Successfully followed" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in followUnfollowUser : ${err.message}`);
  }
};

const updateUser = async (req, res) => {
  const { name, username, email, password, bio } = req.body;
  let { profilePic } = req.body;

  // console.log(profilePic);
  const userId = req.user._id;
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.params.id !== user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You are not authorized to update this user" });
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }

    if (profilePic) {
      if (user.profilePic) {
        await cloudinary.uploader.destroy(
          user.profilePic.split("/").pop().split(".")[0]
        );
      }
      const uploadesResponse = await cloudinary.uploader.upload(profilePic);
      profilePic = uploadesResponse.secure_url;
    }

    user.name = name || user.name;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.profilePic = profilePic || user.profilePic;
    user = await user.save();
    // password should be null in response
    user.password = null;

    //Find all posts that this user replied and update username and userProfilePic fields
    await Post.updateMany(
      { "replies,userId": userId },
      {
        $set: {
          "replies.$[reply].username": user.username,
          "replies.$[reply].userProfilePic": user.profilePic,
        },
      },
      {
        arrayFilters: [{ "reply.userId": userId }],
      }
    );

    await res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in updateUser : ${err.message}`);
  }
};

const getSuggestions = async (req, res) => {
  try {
    const { username } = req.query;
    // console.log(username);

    // Find usernames that start with the search query
    const suggestions = await User.find({
      username: { $regex: `^${username}`, $options: "i" },
    }).select("-password");

    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  getSuggestions,
  getUserProfile,
  signUpUser,
  loginUser,
  logoutUser,
  followUnfollowUser,
  updateUser,
};
