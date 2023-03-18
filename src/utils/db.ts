import color from "colors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectMongoDB = async (uri: string, dbName?: string) => {
  return await mongoose
    .connect(uri, {
      dbName: dbName || "temp",
    })
    .then(() => {
      console.log(color.green("[db]: MongoDB connected successfully"));
    })
    .catch((err: any) => {
      console.error("[db]: Error connecting to MongoDB");
      console.error(err);
    });
};
