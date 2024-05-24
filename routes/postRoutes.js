import mongoose from "mongoose";
import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  likeUnlikePost,
  postList,
  replyToPost,
  getFeedPosts,
  getUserPost,
} from "../controller/postController.js";
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.post("/create", protectRoute, createPost);
// router.get("/", postList);
router.get("/:id", getPost);
router.get("/user/:username", getUserPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:postId", protectRoute, replyToPost);
export default router;
