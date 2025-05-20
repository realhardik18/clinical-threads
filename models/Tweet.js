import { formatDate } from "@/lib/utils";
import mongoose from "mongoose";

const Tweet = new mongoose.Schema({
    screen_name:{type: String, required: true},
    tweet_id:{type: String, required: true},
    tweet_text:{type: String, required: true},
    created_at:{type: String, required: true},
    retweet_count:{type: Number, required: true},
    favorite_count:{type: Number, required: true},
    reply_count:{type: Number, required: true},
    tweet_url:{type: String, required: true},
    category:{type: String, required: false}, // Changed to not required
    avatar_url:{type: String, required: true},
    tagging_confidence: { type: Number, required: true, default: 1 },
    flag: { type: Boolean, required: true, default: true },
    rest_id: { type: String, required: true }
})

export default mongoose.models.Tweet || mongoose.model("Tweet", Tweet)