import dbConnect from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Tweet from "@/models/Tweet";
import { formatDate } from "@/lib/utils";

export async function GET(request) {
    await dbConnect()
    
    // Check if we're searching by URL
    const url = new URL(request.url);
    const tweetUrl = url.searchParams.get('url');
    
    if (tweetUrl) {
        // Find tweet by URL
        const tweet = await Tweet.findOne({ tweet_url: tweetUrl });
        if (!tweet) {
            return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
        }
        return NextResponse.json({ tweet });
    }
    
    // Return all tweets if no URL parameter
    const tweets = await Tweet.find({})
    return NextResponse.json({ tweets });
}

export async function POST(request) {
    await dbConnect();
    const { url, category } = await request.json();

    try {
        // Check if tweet already exists by URL
        const existingTweet = await Tweet.findOne({ tweet_url: url });
        if (existingTweet) {
            return NextResponse.json({ 
                error: "Tweet already exists in the database",
                tweetId: existingTweet._id 
            }, { status: 409 });
        }
        
        // Extract the tweet ID from the URL
        const tweetIdMatch = url.match(/\/status\/(\d+)/);
        if (!tweetIdMatch) {
            return NextResponse.json({ error: "Invalid tweet URL" }, { status: 400 });
        }
        const tweetId = tweetIdMatch[1];
        
        const response = await fetch(
            `https://twitter241.p.rapidapi.com/tweet?pid=${tweetId}`,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-host": "twitter241.p.rapidapi.com",
                    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch tweet data" }, { status: response.status });
        }

        const data = await response.json();
        
        // Log the structure of the API response to understand it better
        console.log('API Response Structure:', JSON.stringify(data, null, 2));
        
        // Safely access nested properties with fallbacks
        const tweetData = data.tweet || {};
        const userData = data.user || {};
        const userLegacy = userData.legacy || {};
        
        // Check if we have the minimum data required
        if (!tweetData.id_str || !userLegacy.screen_name) {
            console.error('Invalid tweet data structure:', data);
            return NextResponse.json({ 
                error: "Invalid tweet data structure from Twitter API" 
            }, { status: 500 });
        }
        
        // Handle created_at - use current date as fallback
        let formattedDate;
        try {
            const createdAt = tweetData.created_at || new Date().toISOString();
            formattedDate = formatDate(createdAt);
        } catch (error) {
            console.error('Error formatting date:', error);
            formattedDate = new Date().toISOString();
        }
        
        const tweet = await Tweet.create({
            screen_name: userLegacy.screen_name,
            tweet_id: tweetData.id_str,
            tweet_text: tweetData.full_text || tweetData.text || "No text available",
            created_at: formattedDate, // Fix: Use formattedDate directly
            retweet_count: tweetData.retweet_count || 0,
            favorite_count: tweetData.favorite_count || 0,
            reply_count: tweetData.reply_count || 0,
            tweet_url: `https://twitter.com/${userLegacy.screen_name}/status/${tweetData.id_str}`,
            avatar_url: userLegacy.profile_image_url_https || null,
            category: category
        });
        
        return NextResponse.json({ 
            message: "Tweet added successfully",
            tweetId: tweet._id 
        }, { status: 201 });
    } catch (error) {
        console.error("Error adding tweet:", error);
        return NextResponse.json({ 
            error: "An error occurred while processing tweet data",
            details: error.message
        }, { status: 500 });
    }
}

export async function DELETE(request) {
    await dbConnect();
    
    // Get the tweet URL from the query parameters
    const url = new URL(request.url);
    const tweetUrl = url.searchParams.get('url');
    
    if (!tweetUrl) {
        return NextResponse.json({ error: "Tweet URL is required" }, { status: 400 });
    }
    
    try {
        const deletedTweet = await Tweet.findOneAndDelete({ tweet_url: tweetUrl });
        
        if (!deletedTweet) {
            return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
        }
        
        return NextResponse.json({ 
            message: "Tweet deleted successfully",
            deletedTweetId: deletedTweet._id 
        });
    } catch (error) {
        console.error("Error deleting tweet:", error);
        return NextResponse.json({ error: "An error occurred while deleting the tweet" }, { status: 500 });
    }
}

export async function PATCH(request) {
    await dbConnect();
    const { url, category } = await request.json();
    
    if (!url) {
        return NextResponse.json({ error: "Tweet URL is required" }, { status: 400 });
    }
    
    try {
        const updatedTweet = await Tweet.findOneAndUpdate(
            { tweet_url: url },
            { category },
            { new: true }
        );
        
        if (!updatedTweet) {
            return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
        }
        
        return NextResponse.json({ 
            message: "Tweet updated successfully",
            tweet: updatedTweet 
        });
    } catch (error) {
        console.error("Error updating tweet:", error);
        return NextResponse.json({ error: "An error occurred while updating the tweet" }, { status: 500 });
    }
}