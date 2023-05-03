import mongoose from "mongoose";

const { Schema, model } = mongoose;

const requestSchema = new Schema({
  user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  text: { type: String },
});

export default requestSchema;
