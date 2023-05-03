import mongoose from "mongoose";
const { Schema, model } = mongoose;

const experiencesSchema = new Schema(
  {
    role: { type: String, required: true },
    company: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    description: { type: String, required: true },
    area: { type: String, required: true },
    image: { type: String, default: "https://via.placeholder.com/250" },
  },
  {
    timestamps: true,
  }
);

export default experiencesSchema;
