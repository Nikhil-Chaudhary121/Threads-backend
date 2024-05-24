import express from "express";

const router = express.Router();

import {
  followUnfollowUser,
  getSuggestions,
  getUserProfile,
  loginUser,
  logoutUser,
  signUpUser,
  updateUser,
} from "../controller/userController.js";
import { protectRoute } from "../middlewares/protectRoute.js";

router.get("/profile/:query", getUserProfile);
router.post("/signup", signUpUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post("/update/:id", protectRoute, updateUser);
router.post("/search", getSuggestions);

export default router;
