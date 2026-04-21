import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var __mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectToMongoDB() {
  const uri = MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI.");
  }

  if (!global.__mongooseConn) {
    global.__mongooseConn = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME ?? "osonmenu",
    });
  }

  return global.__mongooseConn;
}
