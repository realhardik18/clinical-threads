"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SearchBar from "@/components/search-bar"
import { Loader2, AlertCircle, CheckCircle, InfoIcon, ExternalLink, Edit, Trash2, ArrowLeft } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("tweets")
  const [tweets, setTweets] = useState([])
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTweets, setFilteredTweets] = useState([])
  const [newTweetUrl, setNewTweetUrl] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAddingTweet, setIsAddingTweet] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })
  const [editingTweet, setEditingTweet] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)

  // Load tweets and categories - without artificial delay
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch tweets
        const tweetsResponse = await fetch("/api/tweets")
        const { tweets: tweetsData } = await tweetsResponse.json()
        setTweets(tweetsData)
        setFilteredTweets(tweetsData)
        
        // Fetch categories
        const categoriesResponse = await fetch("/api/categories")
        const { categories: categoriesData } = await categoriesResponse.json()
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error loading data:", error)
        setMessage({ text: "Failed to load data", type: "error" })
      } finally {
        setIsLoading(false) // Remove timeout
      }
    }

    fetchData()
  }, [])

  // Filter tweets based on search query
  useEffect(() => {
    if (tweets.length > 0) {
      const query = searchQuery.toLowerCase()
      const filtered = tweets.filter(
        tweet =>
          tweet.tweet_text.toLowerCase().includes(query) ||
          tweet.screen_name.toLowerCase().includes(query) ||
          (tweet.category && tweet.category.toLowerCase().includes(query))
      )
      setFilteredTweets(filtered)
    }
  }, [searchQuery, tweets])

  // Handle adding a new tweet
  const handleAddTweet = async (e) => {
    e.preventDefault()
    if (!newTweetUrl) {
      setMessage({ text: "Please enter a tweet URL", type: "error" })
      return
    }
    if (!selectedCategory) {
      setMessage({ text: "Please select a category", type: "error" })
      return
    }

    setIsAddingTweet(true)
    setMessage({ text: "Adding tweet...", type: "info" })

    try {
      const response = await fetch("/api/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newTweetUrl,
          category: selectedCategory
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add tweet")
      }

      // Refresh tweets list
      const tweetsResponse = await fetch("/api/tweets")
      const { tweets: tweetsData } = await tweetsResponse.json()
      setTweets(tweetsData)
      setFilteredTweets(tweetsData)
      
      setNewTweetUrl("")
      setSelectedCategory("")
      setMessage({ text: "Tweet added successfully", type: "success" })
    } catch (error) {
      console.error("Error adding tweet:", error)
      setMessage({ text: error.message, type: "error" })
    } finally {
      setIsAddingTweet(false)
    }
  }

  // Handle adding a new category
  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName) {
      setMessage({ text: "Please enter a category name", type: "error" })
      return
    }

    setIsAddingCategory(true)
    setMessage({ text: "Adding category...", type: "info" })

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_name: newCategoryName
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add category")
      }

      // Refresh categories list
      const categoriesResponse = await fetch("/api/categories")
      const { categories: categoriesData } = await categoriesResponse.json()
      setCategories(categoriesData)
      
      setNewCategoryName("")
      setMessage({ text: "Category added successfully", type: "success" })
    } catch (error) {
      console.error("Error adding category:", error)
      setMessage({ text: error.message, type: "error" })
    } finally {
      setIsAddingCategory(false)
    }
  }

  // Handle updating a tweet's category
  const handleUpdateTweet = async (tweetId, newCategory) => {
    try {
      setMessage({ text: "Updating tweet...", type: "info" })
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update tweet")
      }

      // Refresh tweets list
      const tweetsResponse = await fetch("/api/tweets")
      const { tweets: tweetsData } = await tweetsResponse.json()
      setTweets(tweetsData)
      setFilteredTweets(tweetsData)
      
      setEditingTweet(null)
      setMessage({ text: "Tweet updated successfully", type: "success" })
    } catch (error) {
      console.error("Error updating tweet:", error)
      setMessage({ text: error.message, type: "error" })
    }
  }

  // Handle deleting a tweet
  const handleDeleteTweet = async (tweetId) => {
    if (!confirm("Are you sure you want to delete this tweet?")) {
      return
    }

    try {
      setMessage({ text: "Deleting tweet...", type: "info" })
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete tweet")
      }

      // Remove tweet from state
      const updatedTweets = tweets.filter(tweet => tweet._id !== tweetId)
      setTweets(updatedTweets)
      setFilteredTweets(updatedTweets)
      
      setMessage({ text: "Tweet deleted successfully", type: "success" })
    } catch (error) {
      console.error("Error deleting tweet:", error)
      setMessage({ text: error.message, type: "error" })
    }
  }

  // Handle deleting a category
  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category? This will remove the category from all tweets.")) {
      return
    }

    try {
      setMessage({ text: "Deleting category...", type: "info" })
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete category")
      }

      // Refresh categories list
      const categoriesResponse = await fetch("/api/categories")
      const { categories: categoriesData } = await categoriesResponse.json()
      setCategories(categoriesData)
      
      // Refresh tweets that might have had this category
      const tweetsResponse = await fetch("/api/tweets")
      const { tweets: tweetsData } = await tweetsResponse.json()
      setTweets(tweetsData)
      setFilteredTweets(tweetsData)
      
      setMessage({ text: "Category deleted successfully", type: "success" })
    } catch (error) {
      console.error("Error deleting category:", error)
      setMessage({ text: error.message, type: "error" })
    }
  }

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: "", type: "" })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-mono font-bold tracking-tight text-center sm:text-left">
                Clinical Threads Admin
              </h1>
            </div>
            <div className="text-center sm:text-right text-sm text-white/70 font-mono space-y-1.5">              
              <p>manage your clinical tweets collection</p>
              <button 
                onClick={() => router.push('/')}
                className="flex items-center justify-center sm:justify-start text-white hover:text-white/80 transition-colors gap-1.5"
              >
                <ArrowLeft size={14} /> Return to main site
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-white/20 mb-6">
            <button 
              className={`px-4 py-2 font-mono text-sm border-b-2 -mb-px transition-colors ${
                activeTab === 'tweets' 
                ? 'border-white text-white' 
                : 'border-transparent text-white/70 hover:text-white hover:border-white/40'
              }`}
              onClick={() => setActiveTab('tweets')}
            >
              Manage Tweets
            </button>
            <button 
              className={`px-4 py-2 font-mono text-sm border-b-2 -mb-px transition-colors ${
                activeTab === 'categories' 
                ? 'border-white text-white' 
                : 'border-transparent text-white/70 hover:text-white hover:border-white/40'
              }`}
              onClick={() => setActiveTab('categories')}
            >
              Manage Categories
            </button>
          </div>
          
          {/* Message display */}
          {message.text && (
            <div className={`mb-4 p-3 rounded-md font-mono text-sm flex items-center gap-2 ${
              message.type === 'error' ? 'bg-white/10 text-white border-l-4 border-white' : 
              message.type === 'success' ? 'bg-white/10 text-white border-l-4 border-white' : 
              'bg-white/10 text-white border-l-4 border-white'
            }`}>
              {message.type === 'error' && <AlertCircle size={16} />}
              {message.type === 'success' && <CheckCircle size={16} />}
              {message.type === 'info' && <InfoIcon size={16} />}
              {message.text}
            </div>
          )}
        </header>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-2 text-white">
              <Loader2 className="animate-spin" size={20} />
              <span className="font-mono">Loading data...</span>
            </div>
          </div>
        ) : activeTab === 'tweets' ? (
          <div>
            {/* Add tweet form */}
            <div className="mb-8 p-4 sm:p-6 border border-white/20 bg-white/5 rounded-lg shadow-lg">
              <h2 className="text-xl font-mono font-semibold mb-4 text-white">Add New Tweet</h2>
              <form onSubmit={handleAddTweet} className="space-y-4">
                <div>
                  <label className="block text-sm font-mono text-white/70 mb-1">Tweet URL</label>
                  <input 
                    type="text" 
                    value={newTweetUrl} 
                    onChange={(e) => setNewTweetUrl(e.target.value)}
                    placeholder="https://twitter.com/username/status/123456789"
                    className="w-full p-2.5 bg-black border border-white/20 rounded-md font-mono text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-white/70 mb-1">Category</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2.5 bg-black border border-white/20 rounded-md font-mono text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.category_name}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={isAddingTweet} 
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 font-mono text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {isAddingTweet && <Loader2 size={16} className="animate-spin" />}
                  {isAddingTweet ? 'Adding...' : 'Add Tweet'}
                </button>
              </form>
            </div>
            
            {/* Tweets list */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-mono font-semibold text-white">Manage Tweets ({filteredTweets.length})</h2>
                <div className="w-full sm:w-auto">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                </div>
              </div>
              <div className="border border-white/20 rounded-lg overflow-hidden bg-white/5 shadow-lg">
                <div className="grid grid-cols-12 bg-white/10 p-3 font-mono text-sm font-bold">
                  <div className="col-span-3 md:col-span-2">Author</div>
                  <div className="col-span-9 md:col-span-7">Tweet</div>
                  <div className="hidden md:block md:col-span-3">Actions</div>
                </div>
                {filteredTweets.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {filteredTweets.map((tweet) => (
                      <div key={tweet._id} className="grid grid-cols-12 p-4 hover:bg-white/5 transition-colors">
                        <div className="col-span-3 md:col-span-2 font-mono text-sm flex items-center space-x-2">
                          {tweet.avatar_url && (
                            <img src={tweet.avatar_url} alt={tweet.screen_name} className="w-6 h-6 rounded-full" />
                          )}
                          <span className="text-white truncate">@{tweet.screen_name}</span>
                        </div>
                        <div className="col-span-9 md:col-span-7 font-mono text-sm">
                          <p className="line-clamp-2">{tweet.tweet_text}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {tweet.category ? (
                              <span className="text-xs px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded-full">
                                {tweet.category}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-white/5 text-white/60 rounded-full">
                                No category
                              </span>
                            )}
                            <span className="text-xs text-white/50">
                              {tweet.created_at}
                            </span>
                          </div>
                          
                          {/* Mobile action buttons */}
                          <div className="flex flex-wrap gap-2 mt-3 md:hidden">
                            <button 
                              onClick={() => setEditingTweet(tweet._id)}
                              className="text-xs px-2 py-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <a 
                              href={tweet.tweet_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-center transition-colors"
                            >
                              <ExternalLink size={12} /> View
                            </a>
                            <button 
                              onClick={() => handleDeleteTweet(tweet._id)}
                              className="text-xs px-2 py-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                        
                        {/* Desktop action buttons */}
                        <div className="hidden md:flex md:col-span-3 flex-col space-y-2">
                          {editingTweet === tweet._id ? (
                            <div className="flex space-x-2">
                              <select 
                                className="flex-1 p-1.5 bg-black border border-white/20 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                                defaultValue={tweet.category || ""}
                                onChange={(e) => handleUpdateTweet(tweet._id, e.target.value)}
                              >
                                <option value="">No category</option>
                                {categories.map((category) => (
                                  <option key={category._id} value={category.category_name}>
                                    {category.category_name}
                                  </option>
                                ))}
                              </select>
                              <button 
                                onClick={() => setEditingTweet(null)}
                                className="text-xs px-2 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => setEditingTweet(tweet._id)}
                                className="text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                              >
                                <Edit size={12} /> Edit Category
                              </button>
                              <a 
                                href={tweet.tweet_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-center transition-colors"
                              >
                                <ExternalLink size={12} /> View Tweet
                              </a>
                              <button 
                                onClick={() => handleDeleteTweet(tweet._id)}
                                className="text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center font-mono text-white/50">
                    No tweets found. Try adjusting your search or add some tweets.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Add category form */}
            <div className="mb-8 p-4 sm:p-6 border border-white/20 bg-white/5 rounded-lg shadow-lg">
              <h2 className="text-xl font-mono font-semibold mb-4 text-white">Add New Category</h2>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-mono text-white/70 mb-1">Category Name</label>
                  <input 
                    type="text" 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Cardiology, Pediatrics"
                    className="w-full p-2.5 bg-black border border-white/20 rounded-md font-mono text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isAddingCategory} 
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 font-mono text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {isAddingCategory && <Loader2 size={16} className="animate-spin" />}
                  {isAddingCategory ? 'Adding...' : 'Add Category'}
                </button>
              </form>
            </div>
            
            {/* Categories list */}
            <div>
              <h2 className="text-xl font-mono font-semibold mb-4 text-white">Manage Categories ({categories.length})</h2>
              <div className="border border-white/20 rounded-lg overflow-hidden bg-white/5 shadow-lg">
                <div className="grid grid-cols-6 bg-white/10 p-3 font-mono text-sm font-bold">
                  <div className="col-span-4 sm:col-span-5">Category Name</div>
                  <div className="col-span-2 sm:col-span-1">Actions</div>
                </div>
                {categories.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {categories.map((category) => (
                      <div key={category._id} className="grid grid-cols-6 p-4 hover:bg-white/5 transition-colors">
                        <div className="col-span-4 sm:col-span-5 font-mono text-sm flex items-center flex-wrap">
                          <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded-full text-xs mr-2">
                            #{category.category_name}
                          </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <button 
                            onClick={() => handleDeleteCategory(category._id)}
                            className="text-xs px-2 py-1.5 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center font-mono text-white/50">
                    No categories found. Add some categories to organize your tweets.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
