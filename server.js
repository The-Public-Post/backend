import express from "express";
import cors from "cors";
import prisma from "./prisma/client.js";
import routes from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 8012;

app.use(cors());
app.use(express.json());




// routes
app.use("/api", routes);





app.get("/", (req, res) => {
  res.send("Server is running");
});




app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Prisma connected to database");
  } catch (err) {
    console.error("Database connection failed");
    console.error(err.message);
  }
}

connectDB();


//for the db shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  try {
    await prisma.$disconnect();
  } catch (e) {
    console.error("Error during Prisma disconnect");
  }
  process.exit(0);
});
