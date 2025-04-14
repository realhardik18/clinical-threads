import dbConnect from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Category from "@/models/Category";
import Tweet from "@/models/Tweet";

export async function GET(request) {
    await dbConnect();
    
    // Check if we're searching by name
    const url = new URL(request.url);
    const categoryName = url.searchParams.get('name');
    
    if (categoryName) {
        // Find category by name
        const category = await Category.findOne({ 
            category_name: { $regex: new RegExp(categoryName, 'i') } 
        });
        
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        
        return NextResponse.json({ category });
    }
    
    // Return all categories if no name parameter
    const categories = await Category.find({});
    return NextResponse.json({ categories });
}

export async function POST(request) {
    await dbConnect();
    const { category_name } = await request.json();
    
    try {
        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            category_name: { $regex: new RegExp(`^${category_name}$`, 'i') } 
        });
        
        if (existingCategory) {
            return NextResponse.json({ 
                error: "Category already exists",
                categoryId: existingCategory._id 
            }, { status: 409 });
        }
        
        const category = await Category.create({
            category_name: category_name,
        });
        
        return NextResponse.json({ 
            message: "Category added successfully",
            categoryId: category._id 
        }, { status: 201 });
    } catch (error) {
        console.error("Error adding category:", error);
        return NextResponse.json({ error: "An error occurred while adding the category" }, { status: 500 });
    }
}

export async function DELETE(request) {
    await dbConnect();
    
    // Get the category name from the query parameters
    const url = new URL(request.url);
    const categoryName = url.searchParams.get('name');
    
    if (!categoryName) {
        return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }
    
    try {
        // Find the category
        const category = await Category.findOne({ 
            category_name: { $regex: new RegExp(`^${categoryName}$`, 'i') } 
        });
        
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        
        // First remove this category from all tweets that use it
        await Tweet.updateMany(
            { category: category.category_name },
            { $set: { category: null } }
        );
        
        // Then delete the category
        await Category.findByIdAndDelete(category._id);
        
        return NextResponse.json({ 
            message: "Category deleted successfully",
            deletedCategoryId: category._id 
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "An error occurred while deleting the category" }, { status: 500 });
    }
}

export async function PATCH(request) {
    await dbConnect();
    
    const { old_name, new_name } = await request.json();
    
    if (!old_name || !new_name) {
        return NextResponse.json({ error: "Both old and new category names are required" }, { status: 400 });
    }
    
    try {
        // Check if the new category name already exists
        const existingCategory = await Category.findOne({ 
            category_name: { $regex: new RegExp(`^${new_name}$`, 'i') },
            category_name: { $ne: old_name }
        });
        
        if (existingCategory) {
            return NextResponse.json({ error: "New category name already exists" }, { status: 409 });
        }
        
        // Find and update the category
        const updatedCategory = await Category.findOneAndUpdate(
            { category_name: { $regex: new RegExp(`^${old_name}$`, 'i') } },
            { category_name: new_name },
            { new: true }
        );
        
        if (!updatedCategory) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        
        // Update the category in all tweets that use it
        await Tweet.updateMany(
            { category: old_name },
            { $set: { category: new_name } }
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
