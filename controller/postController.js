import mongoose from "mongoose";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
  try {
    const { text, postedBy } = req.body;
    let { img } = req.body;
    if (!postedBy || !text) {
      res.status(400).json({ error: "Postedby and text fields are required" });
    }
    const user = await User.findById(postedBy);
    if (!user) {
      res.status(404).json({ error: "User not found" });
    }
    if (user._id.toString() !== req.user._id.toString()) {
      res
        .status(401)
        .json({ error: "You are not authorized to create a post" });
    }
    if (img) {
      const uploadesResponse = await cloudinary.uploader.upload(img);
      img = uploadesResponse.secure_url;
    }

    const maxLength = 500;
    if (text.length > maxLength) {
      res
        .status(400)
        .json({ error: `Text should be less than ${maxLength} characters` });
    }
    const newPost = new Post({ postedBy, text, img });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error creating post : ${err.message}`);
  }
};

const getPost = async (req, res) => {
  try {
    const id = req.params.id;
    // console.log(id);
    // const post = await Post.find({});
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in getPosts: ${err.message}`);
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You are not authorized to delete this post" });
    }
    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in deletePost: ${err.message}`);
  }
};

const postList = async (req, res) => {
  try {
    const posts = await Post.find({});
    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in getPosts: ${err.message}`);
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      // unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      res.status(200).json({ message: "Post unLiked successfully" });
    } else {
      // like post
      post.likes.push(userId);
      await post.save();
      res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in getPosts: ${err.message}`);
  }
};

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.postId;
    const userId = req.user._id;
    const userProfilePic = req.user.profilePic;
    const username = req.user.username;
    const reply = { userId, text, userProfilePic, username };
    // console.log(reply);
    if (!text) {
      res.status(400).json({ error: "Text field is required" });
    }
    const post = await Post.findById(postId);
    // console.log(post);

    if (!post) {
      res.status(404).json({ error: "Post not found" });
    }

    // const reply = { userId, text, userProfilePic, username };

    post.replies.push(reply);
    await post.save();
    // console.log(reply);
    res.status(200).json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in ReplyToPost: ${err.message}`);
  }
};

const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const following = user.following;

    const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({
      createdAt: -1,
    });
    res.status(200).json(feedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(`Error in getFeedPost: ${err.message}`);
  }
};

const getUserPost = async (req, res) => {
  const { username } = req.params;
  // console.log(username);
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const posts = await Post.find({ postedBy: user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(`Error in getUserPost : ${error.message}`);
  }
};

export {
  createPost,
  getPost,
  deletePost,
  postList,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPost,
};
