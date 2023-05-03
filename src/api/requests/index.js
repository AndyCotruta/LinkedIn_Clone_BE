import express, { request } from "express";
import UsersModel from "../users/model.js";
import httpErrors from "http-errors";
import createHttpError from "http-errors";

const { NotFound } = httpErrors;

const requestsRouter = express.Router();

requestsRouter.post("/:targetUserId/pending", async (req, res, next) => {
  try {
    const currentUserId = req.body.user;
    const targetUserId = req.params.targetUserId;
    const currentUser = await UsersModel.findById(currentUserId);
    if (currentUser) {
      const active = currentUser.connections.active.find(
        (connection) => connection.toString() === targetUserId
      );
      const targetUser = await UsersModel.findById(targetUserId);
      const pending = targetUser.connections.pending.find(
        (connection) => connection.user.toString() === currentUserId
      );
      if (active) {
        res
          .status(409)
          .send(`You are already connected with user ${targetUserId}`);
      } else if (pending) {
        res.status(409).send(`You already sent a request to ${targetUserId}`);
      } else {
        const updatedTargetUser = await UsersModel.findByIdAndUpdate(
          targetUserId,
          { $push: { "connections.pending": req.body } },
          { new: true, runValidators: true }
        );
        if (updatedTargetUser) {
          res.status(201).send("Request was sent successfully");
        } else {
          next(NotFound(`TargetUser with id ${userId} was not found`));
        }
      }
    } else {
      next(
        NotFound(
          `Your current user with id ${currentUserId} was not found and is unabble to make a request`
        )
      );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
  //   try {
  //     const currentUserId = req.body.user;
  //     const targetUserId = req.params.targetUserId;
  //     const currentUser = await UsersModel.findById(currentUserId);

  //     if (currentUser) {
  //       const index = currentUser.connections.active.findIndex(
  //         (connection) => connection.toString() === targetUserId
  //       );

  //       if (index !== -1) {
  //         next(
  //           createHttpError(
  //             409,
  //             `You are already connected with user ${targetUserId}`
  //           )
  //         );
  //       } else {
  //         const targetUser = await UsersModel.findById(targetUserId);
  //         const secondIndex = targetUser.connections.pending.find(
  //           (connection) => connection.user.toString() === currentUserId
  //         );
  //         console.log(secondIndex);
  //         if (secondIndex) {
  //           next(
  //             createHttpError(
  //               409,
  //               `You already sent a request to ${targetUserId}`
  //             )
  //           );
  //         } else {
  //           const updatedTargetUser = await UsersModel.findByIdAndUpdate(
  //             targetUserId,
  //             { $push: { "connections.pending": req.body } },
  //             { new: true, runValidators: true }
  //           );
  //           if (updatedTargetUser) {
  //             res.status(201).send("Request was sent successfully");
  //           } else {
  //             next(NotFound(`TargetUser with id ${userId} was not found`));
  //           }
  //         }
  //       }
  //     } else {
  //       next(
  //         NotFound(
  //           `Your current user with id ${currentUserId} was not found and is unabble to make a request`
  //         )
  //       );
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     next(error);
  //   }
});

requestsRouter.put(
  "/:currentUserId/acceptRequest/:requestId",
  async (req, res, next) => {
    try {
      const currentUserId = req.params.currentUserId;
      const requestId = req.params.requestId;
      const user = await UsersModel.findById(currentUserId);
      const index = user.connections.pending.findIndex(
        (req) => req._id.toString() === requestId
      );
      const request = user.connections.pending[index].user;
      console.log(request);
      const updatedcurrentUser = await UsersModel.findByIdAndUpdate(
        currentUserId,
        {
          $push: { "connections.active": { user: request } },
          $pull: { "connections.pending": { _id: requestId } },
        },
        { new: true, runValidators: true }
      );
      if (updatedcurrentUser) {
        await UsersModel.findByIdAndUpdate(
          request,
          { $push: { "connections.active": { user: currentUserId } } },
          { new: true, runValidators: true }
        );
        res.send(updatedcurrentUser);
      } else {
        next(NotFound(`Current user with id ${currentUserId} was not found`));
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

requestsRouter.put(
  "/:currentUserId/declineRequest/:requestId",
  async (req, res, next) => {
    try {
      const currentUserId = req.params.currentUserId;
      const requestId = req.params.requestId;
      const updatedcurrentUser = await UsersModel.findByIdAndUpdate(
        currentUserId,
        { $pull: { "connections.pending": { _id: requestId } } },
        { new: true }
      );
      if (updatedcurrentUser) {
        res.send(updatedcurrentUser);
      } else {
        next(NotFound(`Current user with id ${currentUserId} was not found`));
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

requestsRouter.get("/:targetUserId/", async (req, res, next) => {
  try {
    const userId = req.params.targetUserId;
    const user = await UsersModel.findById(userId);
    if (user) {
      const connections = user.connections;
      res.send(connections);
    } else {
      next(NotFound(`User with id ${userId} not found`));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

requestsRouter.delete(
  "/:currentUserId/deleteConnection/:targetUserId",
  async (req, res, next) => {
    try {
      const currentUserId = req.params.currentUserId;
      const targetUserId = req.params.targetUserId;
      const updatedCurrentUser = await UsersModel.findByIdAndUpdate(
        currentUserId,
        { $pull: { "connections.active": targetUserId } },
        { new: true }
      );
      if (updatedCurrentUser) {
        await UsersModel.findByIdAndUpdate(
          targetUserId,
          { $pull: { "connections.active": currentUserId } },
          { new: true }
        );
        console.log("We are getting here");
        res.send(updatedCurrentUser);
      } else {
        next(NotFound(`User with id ${targetUserId} not found`));
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

export default requestsRouter;
