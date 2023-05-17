import express, { request } from "express";
import httpErrors from "http-errors";
import PostsModel from "./model.js";
import UsersModel from "../users/model.js";
import likeModel from "./likeModel.js";
import createHttpError from "http-errors";
import { checkpostSchema, triggerPostsBadRequest } from "./validator.js";
import { JWTAuthMiddleware } from "../../lib/jwtAuth.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const { NotFound } = httpErrors;

const cloudinaryPost = multer({
  storage: new CloudinaryStorage({
    cloudinary, // cloudinary is going to search in .env vars for smt called process.env.CLOUDINARY_URL
    params: {
      folder: "linkedIn/posts",
    },
  }),
}).single("postImage");

const postsRouter = express.Router();

postsRouter.post(
  "/",
  JWTAuthMiddleware,
  cloudinaryPost,
  checkpostSchema,
  triggerPostsBadRequest,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const url = req.file.path;
      const user = await UsersModel.findById(userId);
      if (user) {
        const newPost = new PostsModel({ ...req.body, image: url, user: user });
        const { _id } = await newPost.save();
        res.status(201).send(`Post with id ${_id} created successfully`);
      } else {
        next(NotFound(`User with id ${userId} not found`));
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

postsRouter.get("/", async (req, res, next) => {
  try {
    const posts = await PostsModel.find()
      .populate("user")
      .populate({ path: "comments.user" });
    res.send(posts);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

postsRouter.put(
  "/:postId",
  JWTAuthMiddleware,
  cloudinaryPost,
  async (req, res, next) => {
    try {
      const user = req.user._id;
      const postId = req.params.postId;

      if (req.file) {
        const url = req.file.path;
        const allowedPost = await PostsModel.findOne({
          user: user,
          _id: postId,
        });
        if (allowedPost) {
          const updatedPost = await PostsModel.findByIdAndUpdate(
            postId,
            { ...req.body, image: url },
            {
              new: true,
              runValidators: true,
            }
          );
          if (updatedPost) {
            res.send(updatedPost);
          } else {
            next(NotFound(`Post with id ${postId} not found`));
          }
        } else {
          next(
            403,
            `You are not allowed to modify a post that doesn't belong to you`
          );
        }
      } else {
        const allowedPost = await PostsModel.findOne({
          user: user,
          _id: postId,
        });
        if (allowedPost) {
          const updatedPost = await PostsModel.findByIdAndUpdate(
            postId,
            { ...req.body },
            {
              new: true,
              runValidators: true,
            }
          );
          if (updatedPost) {
            res.send(updatedPost);
          } else {
            next(NotFound(`Post with id ${postId} not found`));
          }
        } else {
          next(
            403,
            `You are not allowed to modify a post that doesn't belong to you`
          );
        }
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

postsRouter.delete("/:postId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;
    const allowedPost = await PostsModel.findOne({
      user: userId,
      _id: postId,
    });
    if (allowedPost) {
      const deletedPost = await PostsModel.findByIdAndDelete(postId);
      if (deletedPost) {
        res.status(204).send();
      } else {
        next(NotFound(`Post with id ${postId} not found`));
      }
    } else {
      next(
        createHttpError(
          403,
          "You are not allowed to delete someone else's post"
        )
      );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// ********************************** EMBEDDING**************************
postsRouter.post("/:postId/comments", async (req, res, next) => {
  try {
    const currentComment = req.body;

    if (currentComment) {
      const postToInsert = {
        ...req.body,
        commentDate: new Date(),
      };

      const updatedPost = await PostsModel.findByIdAndUpdate(
        req.params.postId,
        { $push: { comments: postToInsert } },
        { new: true, runValidators: true }
      );

      if (updatedPost) {
        res.send(updatedPost);
      } else {
        next(
          createHttpError(404, `Post with id ${req.params.postId} not found!`)
        );
      }
    } else {
      next(createHttpError(404, `Post with id ${req.body.postId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

postsRouter.get("/:postId/comments", async (req, res, next) => {
  try {
    const post = await PostsModel.findById(req.params.postId).populate("user");
    if (post) {
      res.send(post.comments);
    } else {
      next(
        createHttpError(404, `Post with id ${req.params.postId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

postsRouter.get("/:postId/comments/:commentId", async (req, res, next) => {
  try {
    const post = await PostsModel.findById(req.params.postId);
    if (post) {
      console.log(post);
      const currentComment = post.comments.find(
        (post) => post._id.toString() === req.params.commentId
      );
      console.log(currentComment);
      if (currentComment) {
        res.send(currentComment);
      } else {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentId} not found!`
          )
        );
      }
    } else {
      next(
        createHttpError(404, `Post with id ${req.params.postId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

postsRouter.put("/:postId/comments/:commentId", async (req, res, next) => {
  try {
    const post = await PostsModel.findById(req.params.postId);

    if (post) {
      const index = post.comments.findIndex(
        (post) => post._id.toString() === req.params.commentId
      );
      if (index !== -1) {
        post.comments[index] = {
          ...post.comments[index].toObject(),
          ...req.body,
        };

        await post.save();
        res.send(post);
      } else {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentId} not found!`
          )
        );
      }
    } else {
      next(
        createHttpError(404, `Post with id ${req.params.postId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

postsRouter.delete("/:postId/comments/:commentId", async (req, res, next) => {
  try {
    const updatedPost = await PostsModel.findByIdAndUpdate(
      req.params.postId,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    );
    if (updatedPost) {
      res.send(updatedPost);
    } else {
      next(
        createHttpError(404, `Post with id ${req.params.postId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});
// ***********************LIKES**********************
postsRouter.put("/:postId/likes", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const post = await PostsModel.findById(req.params.postId);
    const user = req.user._id;
    if (post) {
      const index = post.likes.findIndex(
        (userId) => userId.userId.toString() === user
      );
      if (index !== -1) {
        const post = await PostsModel.findByIdAndUpdate(
          req.params.postId,
          {
            $pull: { likes: { userId: user } },
          },
          { new: true, runValidators: true }
        );
        const postToSend = await PostsModel.findById(req.params.postId)
          .populate("user")
          .populate({ path: "comments.user" });
        res.send(postToSend);
      } else {
        const post = await PostsModel.findByIdAndUpdate(
          req.params.postId,
          {
            $push: { likes: { userId: user } },
          },
          { new: true, runValidators: true }
        );
        const postToSend = await PostsModel.findById(req.params.postId)
          .populate("user")
          .populate({ path: "comments.user" });
        res.send(postToSend);
      }
    } else {
      next(
        createHttpError(404, `Post with id ${req.params.postId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});
export default postsRouter;
