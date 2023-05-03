import mongoose from "mongoose";
const { Schema, model } = mongoose;

const likesSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "user",
    },
  }
  //   { timestamps: true }
);
export default likesSchema;
