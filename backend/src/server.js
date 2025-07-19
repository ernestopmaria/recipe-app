import express from "express";
import { db } from "./config/db.js";
import { ENV } from "./config/env.js";
import { favoriteTable } from "./db/schema.js";
import { and, desc, eq } from "drizzle-orm";
import job from "./config/cron.js";

const app = express();
app.use(express.json());
const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === "production") job.start();

app.get("/api/health", (req, res) => {
  res.send("Welcome to the Recipe App API");
});
app.post("/api/favorites", async (req, res) => {
  try {
    const { userId, recipeId, title, image, cookTime, servings } = req.body;
    if (!userId || !recipeId || !title) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const newFavorite = await db
      .insert(favoriteTable)
      .values({
        userId,
        recipeId,
        title,
        image,
        cookTime,
        servings,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newFavorite[0],
      message: "Favorite added successfully",
    });
  } catch (error) {
    console.log("Error adding favorite:", error);
    res.status(500).json({
      success: false,
      error: "somethinh went wrong!",
    });
  }
});

app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const favorites = await db
      .select()
      .from(favoriteTable)
      .where(eq(favoriteTable.userId, userId))
      .orderBy(desc(favoriteTable.createdAt));
    if (favorites.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No favorites found for this user",
      });
    }
    res.status(200).json({
      success: true,
      data: favorites,
      message: "Favorites fetched successfully",
    });
  } catch (error) {
    console.log("Error fetching favorites:", error);
    res.status(500).json({
      success: false,
      error: "Something went wrong!",
    });
  }
});

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;
    const deletedFavorite = await db
      .delete(favoriteTable)
      .where(
        and(
          eq(favoriteTable.recipeId, parseInt(recipeId)),
          eq(favoriteTable.userId, userId)
        )
      )
      .returning();
    if (deletedFavorite.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Favorite deleted successfully",
    });
  } catch (error) {
    console.log("Error deleting favorite:", error);
    res.status(500).json({
      success: false,
      error: "Something went wrong!",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
