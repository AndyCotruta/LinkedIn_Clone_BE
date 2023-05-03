import mongoose from "mongoose";

export const badRequestHandler = (err, req, res, next) => {
  if (err.status === 400 || err instanceof mongoose.Error.ValidationError) {
    res.status(400).send({ message: err.message });
  } else if (err instanceof mongoose.Error.CastError) {
    res
      .status(400)
      .send({ message: "You've sent a wrong _id in request params" });
  } else {
    next(err);
  }
};

// export const badRequestHandler = (err, req, res, next) => {
//   //function that takes 4 arguments and handles the type of error
//   if (err.status === 400) {
//     // if error has status 400 do sth
//     res
//       .status(400)
//       .send({ message: err.message, list: err.errorsList.map((e) => e.msg) }); // we manage the error status and link a message
//   } else {
//     next(err); // if the error is not 400 jump to the next error handler
//   }
// };

export const notFoundHandler = (err, req, res, next) => {
  if (err.status === 404) {
    res.status(404).send({ message: err.message });
  } else {
    next(err);
  }
};

export const genericErrorHandler = (err, req, res, next) => {
  console.log(err);
  res.status(500).send({ message: "Generic Server Error" });
};
