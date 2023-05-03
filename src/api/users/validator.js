import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";

const userSchema = {
  firstName: {
    in: ["body"],
    isString: {
      errorMessage: "Firstname is mandatory field and needs to be a string!",
    },
  },
  lastName: {
    in: ["body"],
    isString: {
      errorMessage: "Lastname is mandatory field and needs to be a string!",
    },
  },
  email: {
    in: ["body"],
    isString: {
      errorMessage: "Email is mandatory field and needs to be a string!",
    },
  },
};

export const checkUserSchema = checkSchema(userSchema);
export const triggerBadRequest = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    next(
      createHttpError(400, "Errors during user validation", {
        errorsList: errors.array(),
      })
    );
  } else {
    next();
  }
};
