"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SearchBar from "@/components/search-bar"
import { Loader2, AlertCircle, CheckCircle, InfoIcon, ExternalLink, Trash2, ArrowLeft, Lock } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
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
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [flaggedTweets, setFlaggedTweets] = useState([]) // NEW
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Handle authentication
  const handleAuthenticate = async (e) => {
    e.preventDefault()
    
    try {
      setAuthError("")
      
      const response = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        // Store authentication in session storage to maintain it during page refreshes
        sessionStorage.setItem("adminAuthenticated", "true")
      } else {
        setAuthError("Invalid password. Please try again.")
        setPassword("")
      }
    } catch (error) {
      console.error("Authentication error:", error)
      setAuthError("An error occurred during authentication.")
      setPassword("")
    }
  }

  // Check for existing authentication on page load
  useEffect(() => {
    const authenticated = sessionStorage.getItem("adminAuthenticated") === "true"
    if (authenticated) {
      setIsAuthenticated(true)
    }
  }, [])

  // Load tweets and categories - only if authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

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

        // Filter flagged tweets (flag === false)
        setFlaggedTweets(tweetsData.filter(t => t.flag === false))
      } catch (error) {
        console.error("Error loading data:", error)
        setMessage({ text: "Failed to load data", type: "error" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated])

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
    try {
      setMessage({ text: "Deleting category...", type: "info" })
      
      // Use the dynamic API route for category deletion by ID
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      })

      // Check if the response is ok
      if (!response.ok) {
        // Safely handle potential JSON parsing errors
        let errorMessage = "Failed to delete category";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error("Error parsing response JSON:", jsonError);
          // Use status text if JSON parsing fails
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Optimistically update UI by removing the deleted category
      setCategories(prevCategories => 
        prevCategories.filter(category => category._id !== categoryId)
      );
      
      // Update tweets that might have had this category
      // We can be more efficient by only marking tweets with this category as needing update
      const tweetsResponse = await fetch("/api/tweets");
      const { tweets: tweetsData } = await tweetsResponse.json();
      setTweets(tweetsData);
      setFilteredTweets(tweetsData);
      
      setMessage({ text: "Category deleted successfully", type: "success" });
    } catch (error) {
      console.error("Error deleting category:", error);
      setMessage({ text: error.message, type: "error" });
    } finally {
      // Close the modal after deletion attempt
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  }

  // Start editing a category (open modal)
  const startEditCategory = (category) => {
    setEditingCategoryId(category._id)
    setEditingCategoryName(category.category_name)
  }

  // Cancel editing (close modal)
  const cancelEditCategory = () => {
    setEditingCategoryId(null)
    setEditingCategoryName("")
    setIsEditingCategory(false)
  }

  // Save edited category (modal)
  const handleEditCategory = async (e) => {
    e.preventDefault()
    if (!editingCategoryName.trim()) {
      setMessage({ text: "Category name cannot be empty", type: "error" })
      return
    }
    setIsEditingCategory(true)
    setMessage({ text: "Updating category...", type: "info" })
    try {
      const response = await fetch(`/api/categories/${editingCategoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_name: editingCategoryName.trim() })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update category")
      }
      // Refresh categories list
      const categoriesResponse = await fetch("/api/categories")
      const { categories: categoriesData } = await categoriesResponse.json()
      setCategories(categoriesData)
      setMessage({ text: "Category updated successfully", type: "success" })
      cancelEditCategory()
    } catch (error) {
      console.error("Error updating category:", error)
      setMessage({ text: error.message, type: "error" })
    } finally {
      setIsEditingCategory(false)
    }
  }

  // Open delete confirmation modal
  const openDeleteModal = (category) => {
    setCategoryToDelete(category)
    setShowDeleteModal(true)
  }

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setCategoryToDelete(null)
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

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem("adminAuthenticated")
  }

  // Approve flagged tweet (set flag to true)
  const handleApproveTweet = async (tweetId) => {
    try {
      // Optimistically remove the tweet from flagged tweets
      setFlaggedTweets(prev => prev.filter(t => t._id !== tweetId))
      
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: true })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to approve tweet")
      }

      // Show success message
      setSuccessMessage("Tweet approved successfully!")
      setShowSuccessModal(true)
      setTimeout(() => setShowSuccessModal(false), 2000)
      
      // Fetch fresh data in background
      const tweetsResponse = await fetch("/api/tweets")
      const { tweets: tweetsData } = await tweetsResponse.json()
      setTweets(tweetsData)
      setFilteredTweets(tweetsData)
      
    } catch (error) {
      // Revert optimistic update on error
      const tweetsResponse = await fetch("/api/tweets")
      const { tweets: tweetsData } = await tweetsResponse.json()
      setTweets(tweetsData)
      setFilteredTweets(tweetsData)
      setFlaggedTweets(tweetsData.filter(t => t.flag === false))
      setMessage({ text: error.message, type: "error" })
    }
  }

  // Delete flagged tweet
  const handleDeleteFlaggedTweet = async (tweetId) => {
    if (!confirm("Are you sure you want to delete this tweet?")) return
    try {
      // Optimistically remove the tweet from flagged tweets
      setFlaggedTweets(prev => prev.filter(t => t._id !== tweetId))
      
      const response = await fetch(`/api/tweets/${tweetId}`, { 
        method: "DELETE" 
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete tweet")
      }

      // Show success message
      setSuccessMessage("Tweet deleted successfully!")
      setShowSuccessModal(true)
      setTimeout(() => setShowSuccessModal(false), 2000)
      
      // Update tweets list in background
      const tweetsResponse = await fetch("/api/tweets")
      const { tweets: tweetsData } = await tweetsResponse.json()
      setTweets(tweetsData)
      setFilteredTweets(tweetsData)
      
    } catch (error) {
      // Revert optimistic update on error
      const tweetsResponse = await fetch("/api/tweets")
      const { tweets: tweetsData } = await tweetsResponse.json()
      setTweets(tweetsData)
      setFilteredTweets(tweetsData)
      setFlaggedTweets(tweetsData.filter(t => t.flag === false))
      setMessage({ text: error.message, type: "error" })
    }
  }

  // State for changing category for a flagged tweet
  const [changingCategoryId, setChangingCategoryId] = useState(null)
  const [changingCategoryValue, setChangingCategoryValue] = useState("")

  // Change category and approve
  const handleChangeCategoryAndApprove = async (tweetId) => {
    if (!changingCategoryValue) {
      setMessage({ text: "Please select a category", type: "error" })
      return
    }
    try {
      // Optimistically remove the tweet from flagged tweets
      setFlaggedTweets(prev => prev.filter(t => t._id !== tweetId))
      
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          category: changingCategoryValue, 
          flag: true 
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update tweet")
      }

      // Reset category selection state
      setChangingCategoryId(null)
      setChangingCategoryValue("")
      
      // Show success message
      setSuccessMessage("Tweet category updated and approved!")
      setShowSuccessModal(true)
      setTimeout(() => setShowSuccessModal(false), 2000)
      
      // Fetch fresh data in background
      const tweetsResponse = await fetch("/api/tweets")
      const { tweets: tweetsData } = await tweetsResponse.json()
      setTweets(tweetsData)
      setFilteredTweets(tweetsData)
      
    } catch (error) {
      // Revert optimistic update on error
      const tweetsResponse = await fetch("/api/tweets")
      const { tweets: tweetsData } = await tweetsResponse.json()
      setTweets(tweetsData)
      setFilteredTweets(tweetsData)
      setFlaggedTweets(tweetsData.filter(t => t.flag === false))
      setMessage({ text: error.message, type: "error" })
    }
  }

  // Update the formatDate function
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }

      const now = new Date()
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      const diffInHours = Math.floor(diffInMinutes / 60)
      const diffInDays = Math.floor(diffInHours / 24)

      if (diffInMinutes < 60) {
        return diffInMinutes <= 1 ? 'just now' : `${diffInMinutes}m ago`
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`
      } else if (diffInDays === 1) {
        return 'Yesterday'
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`
      } else {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(date)
      }
    } catch (error) {
      console.warn(`Date formatting error for: ${dateString}`, error)
      return 'Date unavailable'
    }
  }

  // Format confidence score
  const formatConfidence = (confidence) => {
    if (typeof confidence === 'number' && confidence % 1 !== 0) {
      return confidence.toFixed(2) + '%'
    }
    return Math.round(confidence) + '%'
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {!isAuthenticated ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md p-6 border border-white/20 rounded-lg bg-white/5 shadow-lg">
            <div className="flex flex-col items-center justify-center mb-6">
              <Lock className="w-12 h-12 text-white mb-4" />
              <h1 className="text-2xl font-mono font-bold text-white">Admin Authentication</h1>
              <p className="mt-2 text-sm text-white/70 font-mono text-center">
                Enter the admin password to access the Clinical Threads admin panel
              </p>
            </div>

            {authError && (
              <div className="p-3 mb-4 bg-white/10 border-l-4 border-white text-white rounded-md font-mono text-sm">
                <AlertCircle className="inline-block mr-2 h-4 w-4" />
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-white/70 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-black border border-white/20 rounded-md font-mono text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
                  placeholder="Enter password"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 font-mono text-sm rounded-md transition-all shadow-md"
              >
                Login to Admin
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-white/70 hover:text-white font-mono flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft size={14} /> Return to main site
              </button>
            </div>
          </div>
        </div>
      ) : (
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
                <div className="flex flex-wrap justify-center sm:justify-end gap-3">
                  <button 
                    onClick={handleLogout}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                  <span className="text-white/50">•</span>
                  <button 
                    onClick={() => router.push('/')}
                    className="flex items-center justify-center sm:justify-end text-white hover:text-white/80 transition-colors gap-1.5"
                  >
                    <ArrowLeft size={14} /> Return to main site
                  </button>
                </div>
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
              <button
                className={`px-4 py-2 font-mono text-sm border-b-2 -mb-px transition-colors ${
                  activeTab === 'flagged'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/70 hover:text-white hover:border-white/40'
                }`}
                onClick={() => setActiveTab('flagged')}
              >
                AI Curated Tweets
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
                    <div className="col-span-3 md:col-span-3">Author</div>
                    <div className="col-span-9 md:col-span-7">Tweet</div>
                    <div className="hidden md:block md:col-span-2">Actions</div>
                  </div>
                  {filteredTweets.length > 0 ? (
                    <div className="divide-y divide-white/10">
                      {filteredTweets.map((tweet) => (
                        <div key={tweet._id} className="grid grid-cols-12 p-4 hover:bg-white/5 transition-colors">
                          <div className="col-span-3 md:col-span-3 font-mono text-sm flex items-center space-x-2">
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
                                {formatDate(tweet.created_at)}
                              </span>
                            </div>
                            
                            {/* Mobile action buttons */}
                            <div className="flex flex-wrap gap-2 mt-3 md:hidden">
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
                          <div className="hidden md:flex md:col-span-2 flex-col space-y-2">
                            <a 
                              href={tweet.tweet_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-center transition-colors"
                            >
                              <ExternalLink size={12} /> View
                            </a>
                            <button 
                              onClick={() => handleDeleteTweet(tweet._id)}
                              className="text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
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
          ) : activeTab === 'categories' ? (
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
                          <div className="col-span-2 sm:col-span-1 flex gap-2">
                            <button
                              onClick={() => startEditCategory(category)}
                              className="text-xs px-2 py-1.5 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                              disabled={editingCategoryId === category._id}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => openDeleteModal(category)}
                              className="text-xs px-2 py-1.5 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                              disabled={editingCategoryId === category._id}
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
          ) : (
            // Flagged Tweets Tab
            <div>
              <h2 className="text-xl font-mono font-semibold mb-4 text-white">AI Curated Tweets ({flaggedTweets.length})</h2>
              <div className="grid grid-cols-1 gap-4">
                {flaggedTweets.length > 0 ? (
                  flaggedTweets.map((tweet) => {
                    const confidence = Math.round((tweet.tagging_confidence ?? 0) * 100)
                    let barColor = "bg-red-500"
                    if (confidence >= 80) barColor = "bg-green-500"
                    else if (confidence >= 50) barColor = "bg-yellow-500"
                    
                    return (
                      <div key={tweet._id} 
                        className="border border-white/20 rounded-lg bg-white/5 p-4 hover:bg-white/10 transition-all shadow-lg"
                      >
                        {/* Header - Author Info */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {tweet.avatar_url && (
                              <img src={tweet.avatar_url} alt={tweet.screen_name} className="w-8 h-8 rounded-full" />
                            )}
                            <div>
                              <span className="text-white font-mono">@{tweet.screen_name}</span>
                              <span className="text-xs text-white/50 block">{formatDate(tweet.created_at)}</span>
                            </div>
                          </div>
                          <a
                            href={tweet.tweet_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-center text-xs text-white font-mono flex items-center gap-1.5"
                          >
                            <ExternalLink size={12} /> View Tweet
                          </a>
                        </div>

                        {/* Tweet Content */}
                        <p className="text-sm font-mono mb-4 text-white/90">{tweet.tweet_text}</p>

                        {/* Category & Confidence */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white/5 rounded-lg p-3">
                            <span className="text-xs text-white/50 block mb-2">Predicted Category</span>
                            {tweet.category ? (
                              <span className="text-sm px-2 py-1 bg-white/10 border border-white/20 text-white rounded-full">
                                {tweet.category}
                              </span>
                            ) : (
                              <span className="text-sm px-2 py-1 bg-white/5 text-white/60 rounded-full">
                                None
                              </span>
                            )}
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <span className="text-xs text-white/50 block mb-2">AI Confidence</span>
                            <div className="flex items-center gap-3">
                              <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`${barColor} h-2 rounded-full transition-all duration-500`}
                                  style={{ width: `${confidence}%` }}
                                ></div>
                              </div>
                              <span className="font-mono text-sm min-w-[40px] text-right">
                                {formatConfidence(tweet.tagging_confidence * 100)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          {changingCategoryId === tweet._id ? (
                            <div className="flex flex-col gap-3 p-3 bg-white/5 rounded-lg">
                              <select
                                value={changingCategoryValue}
                                onChange={e => setChangingCategoryValue(e.target.value)}
                                className="w-full p-2 bg-black border border-white/20 rounded-md font-mono text-sm text-white"
                              >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                  <option key={cat._id} value={cat.category_name}>
                                    {cat.category_name}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleChangeCategoryAndApprove(tweet._id)}
                                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-mono text-sm"
                                >
                                  Save & Approve
                                </button>
                                <button
                                  onClick={() => { setChangingCategoryId(null); setChangingCategoryValue(""); }}
                                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md font-mono text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                onClick={() => handleApproveTweet(tweet._id)}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-mono text-sm flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                onClick={() => { setChangingCategoryId(tweet._id); setChangingCategoryValue(tweet.category || ""); }}
                                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-mono text-sm flex items-center justify-center gap-1.5"
                              >
                                Change Category
                              </button>
                              <button
                                onClick={() => handleDeleteFlaggedTweet(tweet._id)}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-mono text-sm flex items-center justify-center gap-1.5"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12 border border-white/20 rounded-lg bg-white/5">
                    <p className="font-mono text-white/50">No flagged tweets found.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Edit Category Modal */}
          {editingCategoryId && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-mono font-bold mb-4">Edit Category</h3>
                <form onSubmit={handleEditCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-mono text-white/70 mb-1">Category Name</label>
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={e => setEditingCategoryName(e.target.value)}
                      className="w-full p-2.5 bg-black border border-white/20 rounded-md font-mono text-sm text-white focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-colors"
                      autoFocus
                      disabled={isEditingCategory}
                    />
                  </div>
                  {isEditingCategory && (
                    <div className="flex items-center gap-2 text-white/80 font-mono text-xs">
                      <Loader2 className="animate-spin" size={16} /> Saving...
                    </div>
                  )}
                  {message.text && editingCategoryId && (
                    <div className={`p-2 rounded-md font-mono text-xs flex items-center gap-2 ${
                      message.type === 'error' ? 'bg-red-500/20 text-red-200' :
                      message.type === 'success' ? 'bg-green-500/20 text-green-200' :
                      'bg-white/10 text-white'
                    }`}>
                      {message.type === 'error' && <AlertCircle size={14} />}
                      {message.type === 'success' && <CheckCircle size={14} />}
                      {message.type === 'info' && <InfoIcon size={14} />}
                      {message.text}
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={cancelEditCategory}
                      className="px-4 py-2 font-mono text-sm text-white/80 hover:text-white bg-transparent hover:bg-white/10 rounded-md transition-colors"
                      disabled={isEditingCategory}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 font-mono text-sm text-white bg-white/20 hover:bg-white/30 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                      disabled={isEditingCategory}
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Category Confirmation Modal */}
          {showDeleteModal && categoryToDelete && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-mono font-bold mb-4">Delete Category</h3>
                <p className="mb-6 font-mono text-sm text-white/90">
                  Are you sure you want to delete the category <span className="font-bold">#{categoryToDelete.category_name}</span>? 
                  This will remove the category from all associated tweets.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeDeleteModal}
                    className="px-4 py-2 font-mono text-sm text-white/80 hover:text-white bg-transparent hover:bg-white/10 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(categoryToDelete._id)}
                    className="px-4 py-2 font-mono text-sm text-white bg-white/20 hover:bg-white/30 rounded-md transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Category
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
              <CheckCircle size={20} />
              <p className="font-mono text-sm">{successMessage}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
