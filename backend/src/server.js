import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
