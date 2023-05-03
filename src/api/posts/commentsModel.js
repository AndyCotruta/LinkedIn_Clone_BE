import mongoose from "mongoose";
const { Schema, model } = mongoose;

const commentsSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);
export default commentsSchema;
