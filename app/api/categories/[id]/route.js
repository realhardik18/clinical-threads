import dbConnect from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Category from "@/models/Category";
import Tweet from "@/models/Tweet";

export async function GET(request, { params }) {
    await dbConnect();
    const { id } = params;
    
    try {
        const category = await Category.findById(id);
        
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        
        return NextResponse.json({ category });
    } catch (error) {
        console.error("Error getting category:", error);
        return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    await dbConnect();
    const { id } = params;
    
    try {
        // Find the category
        const category = await Category.findById(id);
        
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        
        // First remove this category from all tweets that use it
        await Tweet.updateMany(
            { category: category.category_name },
            { $set: { category: null } }
        );
        
        // Then delete the category
        const deletedCategory = await Category.findByIdAndDelete(id);
        
        return NextResponse.json({ 
            message: "Category deleted successfully",
            deletedCategory 
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "An error occurred while deleting the category" }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    await dbConnect();
    const { id } = params;
    const { category_name } = await request.json();
    
    if (!category_name) {
        return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }
    
    try {
        // Check if the category exists
        const existingCategory = await Category.findById(id);
        
        if (!existingCategory) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        
        // Check if the new name already exists (for different category)
        const nameExists = await Category.findOne({
            category_name: { $regex: new RegExp(`^${category_name}$`, 'i') },
            _id: { $ne: id }
        });
        
        if (nameExists) {
            return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
        }
        
        // Update tweets with the old category name
        await Tweet.updateMany(
            { category: existingCategory.category_name },
            { $set: { category: category_name } }
        );
        
        // Update the category
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { category_name },
            { new: true }
        );
        
        return NextResponse.json({ 
            message: "Category updated successfully",
            category: updatedCategory 
        });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "An error occurred while updating the category" }, { status: 500 });
    }
}
