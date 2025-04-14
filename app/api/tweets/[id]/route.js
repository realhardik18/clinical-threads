import dbConnect from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Tweet from "@/models/Tweet";

export async function PUT(request, context) {
    await dbConnect();
    const id = context.params.id;
    const { category } = await request.json();

    try {
        const updatedTweet = await Tweet.findByIdAndUpdate(
            id,
            { category },
            { new: true, runValidators: true }
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    await dbConnect();
    const id = context.params.id;

    try {
        const deletedTweet = await Tweet.findByIdAndDelete(id);

        if (!deletedTweet) {
            return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            message: "Tweet deleted successfully",
            deletedTweetId: deletedTweet._id 
        });
    } catch (error) {
        console.error("Error deleting tweet:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
