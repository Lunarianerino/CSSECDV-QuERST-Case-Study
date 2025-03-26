// Importing mongoose library along with Connection type from it
import mongoose, { Connection } from "mongoose";

// Declaring a variable to store the cached database connection
let cachedConnection: Connection | null = null;

// Function to establish a connection to MongoDB
export async function connectToMongoDB() {
  // If a cached connection exists, return it
  if (cachedConnection) {
    console.log("Using cached db connection");
    return cachedConnection;
  }
  try {
    // If no cached connection exists, establish a new connection to MongoDB
    const cnx = await mongoose.connect(process.env.MONGO_DB_URI!);
    // Cache the connection for future use
    cachedConnection = cnx.connection;
    // Log message indicating a new MongoDB connection is established
    console.log("New mongodb connection established");
    // Return the newly established connection
    return cachedConnection;
  } catch (error) {
    // If an error occurs during connection, log the error and throw it
    console.log(error);
    throw error;
  }
}

// const connection = mongoose.createConnection(process.env.MONGODB_URI!);

// connection.once("open", () => {
//   console.log("MongoDB database connection established successfully");
// });

// connection.on("connected", () => {
//   console.log("MongoDB database connected");
// });

// connection.on("disconnected", () => {
//   console.log("MongoDB database disconnected");
// });

// connection.on("error", (err) => {
//   console.log("MongoDB database connection error. Please make sure MongoDB is running. " + err);
// });
// export { connection };
