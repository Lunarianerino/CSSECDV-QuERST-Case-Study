import mongoose, { Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI || MONGODB_URI === "") {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: Connection | null;
  promise: Promise<typeof mongoose> | null;
}

/** 
 * Cached connection for MongoDB.
 */
let cached = (global as any).mongoose as MongooseCache;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }
  const mongoose_instance = await cached.promise;
  cached.conn = mongoose_instance.connection;
  return cached.conn;
}

export default dbConnect;