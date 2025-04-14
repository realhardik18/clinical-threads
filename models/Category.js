import mongoose from "mongoose";

const Category = new mongoose.Schema({
    category_name: { type: String, required: true },
});

export default mongoose.models.Category || mongoose.model("Category", Category);