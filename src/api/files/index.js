import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { pipeline } from "stream";
import json2csv from "json2csv";
import { getPDFReadableStream } from "../../lib/pdf-tools.js";
import UsersModel from "../users/model.js";
import PostsModel from "../posts/model.js";
import createHttpError from "http-errors";
import { trusted } from "mongoose";
import { Readable } from "stream";

const filesRouter = express.Router();

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BE_1_BUILD_WEEK/postsImgs",
    },
  }),
}).single("postImg");

const cloudinaryExperiencesUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BE_1_BUILD_WEEK/expImgs",
    },
  }),
}).single("expImg");

const cloudinaryUsersUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BE_1_BUILD_WEEK/usersImgs",
    },
  }),
}).single("userImg");

filesRouter.post(
  "/users/:userId/image",
  cloudinaryUsersUploader,
  async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const url = req.file.path;
      const updatedUser = await UsersModel.findByIdAndUpdate(
        userId,
        { image: url },
        { new: true, runValidators: true }
      );
      if (updatedUser) {
        res.send(updatedUser);
      } else {
        next(createHttpError(404, `User with id ${userId} was not found`));
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

filesRouter.post(
  "/posts/:postId/image",
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      const postId = req.params.postId;
      const url = req.file.path;
      const updatedPost = await PostsModel.findByIdAndUpdate(
        postId,
        { image: url },
        { new: true, runValidators: true }
      );
      if (updatedPost) {
        res.send("File uploaded successfully");
      } else {
        next(createHttpError(404, `Post with id ${postId} was not found`));
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

filesRouter.post(
  "/users/:userId/experiences/:expId/image",
  cloudinaryExperiencesUploader,
  async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const expId = req.params.expId;
      const url = req.file.path;
      const user = await UsersModel.findById(userId);
      if (user) {
        const index = user.experiences.findIndex(
          (exp) => exp._id.toString() === expId
        );
        if (index !== -1) {
          user.experiences[index] = {
            ...user.experiences[index].toObject(),
            image: url,
          };
          await user.save();
          res.send(user);
        } else {
          next(
            createHttpError(404, `Experience with id ${expId} was not found`)
          );
        }
      } else {
        next(createHttpError(404, `User with id ${userId} was not found`));
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

filesRouter.get("/:userId/pdf", async (req, res, next) => {
  res.setHeader("Content-Disposition", "attachment; filename=cv.pdf");
  try {
    const userCV = await UsersModel.findById(req.params.userId).populate({
      path: "experiences",
    });
    if (userCV) {
      const source = await getPDFReadableStream(userCV);
      const destination = res;
      pipeline(source, destination, (err) => {
        if (err) console.log(err);
      });
    } else {
      next(
        createHttpError(404, `User with id ${req.params.userId} is not found`)
      );
    }
  } catch (error) {
    next(error);
  }
});
// filesRouter.get("/:userId/experiences/CSV", async (req, res, next) => {
//   try {
//     const userCV = await UsersModel.findById(req.params.userId);
//     const experiences = userCV.experiences;
//     const source = new Readable({
//       read() {
//         this.push(JSON.stringify(experiences));
//         this.push(null);
//       },
//     });
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=experiences.csv"
//     );

//     const transform = new json2csv.Transform({
//       fields: ["role", "company", "description"],
//     });
//     const destination = res;
//     pipeline(source, transform, destination, (err) => {
//       if (err) console.log(err);
//     });
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// });

filesRouter.get("/:userId/experiences/CSV", async (req, res, next) => {
  const userId = req.params.userId;
  const user = await UsersModel.findById(userId);
  if (user) {
    const experiences = user.experiences;
    const source = JSON.stringify(experiences);
    const transform = new json2csv.Transform({
      fields: ["role", "company", "description"],
    });
    const destination = res;
    pipeline(source, transform, destination, (err) => {
      if (err) {
        console.log(err);
      }
    });
  } else {
    createHttpError(404, `User with id ${req.params.userId} is not found`);
  }
});

export default filesRouter;
