import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var __mongooseConn: Promise<typeof mongoose> | undefined;
  var __mongoConnectedLogged: boolean | undefined;
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

  try {
    const connection = await global.__mongooseConn;

    if (!global.__mongoConnectedLogged) {
      const dbName = connection.connection.name;
      console.log(`[MongoDB] Connected successfully to database "${dbName}".`);
      global.__mongoConnectedLogged = true;
    }

    return connection;
  } catch (error) {
    global.__mongooseConn = undefined;
    global.__mongoConnectedLogged = false;
    console.error("[MongoDB] Connection failed.", error);
    throw error;
  }
}
