import express from "express";
import dotenv from "dotenv";
import connetDb from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

dotenv.config();
connetDb();

const app = express();
const PORT = process.env.PORT || 5000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extends: true }));
app.use(cookieParser());

app.use(cors());

app.options("/api/users/profile:query", cors());
app.options("/api/users/signup", cors());
app.options("/api/users/login", cors());
app.options("/api/users/logout", cors());
app.options("/api/users/follow/:id", cors());
app.options("/api/users/update/:id", cors());
app.options("/api/users/search", cors());

router.get("/feed", protectRoute, getFeedPosts);
router.post("/create", protectRoute, createPost);
// router.get("/", postList);
router.get("/:id", getPost);
router.get("/user/:username", getUserPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:postId", protectRoute, replyToPost);

app.options("/api/posts/feed", cors());
app.options("/api/posts/create", cors());
app.options("/api/posts/:id", cors());
app.options("/api/posts/user/:username", cors());
app.options("/api/posts/like/:id", cors());
app.options("/api/posts/reply/:postId:", cors());

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.listen(PORT, () => {
  console.log("listening on port ", PORT);
});
