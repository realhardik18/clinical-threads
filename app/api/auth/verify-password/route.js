import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { password } = await request.json();
        const correctPassword = process.env.ADMIN_PASSWORD;

        if (!correctPassword) {
            console.error("Admin password not configured in environment variables");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        if (password === correctPassword) {
            return NextResponse.json(
                { success: true, message: "Authentication successful" },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { success: false, message: "Invalid password" },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error("Password verification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
