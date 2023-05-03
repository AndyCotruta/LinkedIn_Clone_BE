import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";
import mongoose from "mongoose";

const postSchema = {
  text: {
    in: ["body"],
    isString: {
      errorMessage: "Text is mandatory field and needs to be a string!",
    },
  },
  user: {
    in: ["body"],
    isString: {
      errorMessage: "User is mandatory field and needs to be a string!",
    },
  },
};

export const checkpostSchema = checkSchema(postSchema);
export const triggerPostsBadRequest = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    next(
      createHttpError(400, "Errors during post validation", {
        errorsList: errors.array(),
      })
    );
  } else {
    next();
  }
};
