import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_POSTS, MOCK_USERS } from "../data/mockData";
import { getPostsFromSupabase, getUsersFromSupabase, supabase } from "../utils/supabase";
import confetti from "canvas-confetti";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Posts & Users state
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem("sotwe_scraped_posts");
      const parsed = saved ? JSON.parse(saved) : [];
      if (parsed && parsed.length > 0) {
        const idSet = new Set(parsed.map(p => p.id));
        const newFromMock = MOCK_POSTS.filter(p => !idSet.has(p.id));
        return [...newFromMock, ...parsed];
      }
      return MOCK_POSTS;
    } catch {
      return MOCK_POSTS;
    }
  });

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem("sotwe_scraped_users");
      const parsed = saved ? JSON.parse(saved) : [];
      if (parsed && parsed.length > 0) {
        const idSet = new Set(parsed.map(u => u.id));
        const newFromMock = MOCK_USERS.filter(u => !idSet.has(u.id));
        return [...newFromMock, ...parsed];
      }
      return MOCK_USERS;
    } catch {
      return MOCK_USERS;
    }
  });

  // Load from Supabase Cloud on mount & subscribe to realtime updates
  useEffect(() => {
    let isMounted = true;
    async function loadCloudData() {
      try {
        const [cloudPosts, cloudUsers] = await Promise.all([
          getPostsFromSupabase(0, 5000),
          getUsersFromSupabase()
        ]);
        if (isMounted) {
          if (cloudPosts && cloudPosts.length > 0) {
            setPosts(cloudPosts);
          }
          if (cloudUsers && cloudUsers.length > 0) {
            setUsers(cloudUsers);
          }
        }
      } catch (err) {
        console.warn("Supabase cloud load error:", err);
      }
    }

    loadCloudData();

    // Supabase Realtime channel for instant live video & user additions
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const p = payload.new;
          if (p) {
            const formatted = {
              id: p.id,
              userId: p.user_id,
              content: p.content,
              createdAt: p.created_at || "Yeni",
              mediaType: p.media_type || "video",
              media: p.media || [],
              stats: p.stats || { likes: 100, replies: 10, retweets: 20, bookmarks: 15 }
            };
            setPosts((prev) => [formatted, ...prev.filter((x) => x.id !== formatted.id)]);
            setUsers((prev) =>
              prev.map((u) => {
                if (u.id === p.user_id) {
                  return { ...u, postsCount: (u.postsCount || 0) + 1 };
                }
                return u;
              })
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        (payload) => {
          const u = payload.new;
          if (u) {
            const formatted = {
              id: u.id,
              name: u.name,
              handle: u.handle,
              avatar: u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.id}`,
              banner: u.banner || "",
              bio: u.bio || `@${u.id} paylaşımları`,
              verified: !!u.verified,
              badgeType: u.badge_type || "none",
              following: u.following || 0,
              followers: u.followers || 0,
              postsCount: u.posts_count || 0
            };
            setUsers((prev) => [formatted, ...prev.filter((x) => x.id !== formatted.id)]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          const p = payload.old;
          if (p && p.id) {
            setPosts((prev) => prev.filter((x) => x.id !== p.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem("sotwe_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });

  const [likes, setLikes] = useState(() => {
    const saved = localStorage.getItem("sotwe_likes");
    return saved ? JSON.parse(saved) : [];
  });

  const [retweets, setRetweets] = useState(() => {
    const saved = localStorage.getItem("sotwe_retweets");
    return saved ? JSON.parse(saved) : [];
  });

  const [following, setFollowing] = useState(() => {
    const saved = localStorage.getItem("sotwe_following");
    return saved ? JSON.parse(saved) : [];
  });

  // UI state
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'vertical'
  const [searchQuery, setSearchQuery] = useState("");
  const [layoutMode, setLayoutMode] = useState("masonry"); // 'masonry' | 'feed'

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);
  const [commentsModalPost, setCommentsModalPost] = useState(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [verticalFeedConfig, setVerticalFeedConfig] = useState({ userId: null, startPostId: null });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("sotwe_scraped_posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("sotwe_scraped_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("sotwe_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem("sotwe_likes", JSON.stringify(likes));
  }, [likes]);

  useEffect(() => {
    localStorage.setItem("sotwe_retweets", JSON.stringify(retweets));
  }, [retweets]);

  useEffect(() => {
    localStorage.setItem("sotwe_following", JSON.stringify(following));
  }, [following]);


  // Trigger Toast Notification
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3000);
  };

  // Toggle Like
  const toggleLike = (postId, e) => {
    const isLiked = likes.includes(postId);
    const newLikes = isLiked
      ? likes.filter((id) => id !== postId)
      : [...likes, postId];

    setLikes(newLikes);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            stats: {
              ...p.stats,
              likes: isLiked ? (p.stats?.likes || 1) - 1 : (p.stats?.likes || 0) + 1
            }
          };
        }
        return p;
      })
    );

    if (!isLiked) {
      showToast("Beğenilere eklendi ❤️", "heart");
      if (e) {
        try {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (rect.left + rect.width / 2) / window.innerWidth;
          const y = (rect.top + rect.height / 2) / window.innerHeight;
          confetti({
            particleCount: 25,
            spread: 60,
            origin: { x, y },
            colors: ["#f91880", "#ff4b91", "#ff76ce", "#ffffff"]
          });
        } catch {
          // ignore
        }
      }
    } else {
      showToast("Beğeni kaldırıldı", "info");
    }
  };

  // Toggle Retweet
  const toggleRetweet = (postId) => {
    const isRetweeted = retweets.includes(postId);
    const newRetweets = isRetweeted
      ? retweets.filter((id) => id !== postId)
      : [...retweets, postId];

    setRetweets(newRetweets);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            stats: {
              ...p.stats,
              retweets: isRetweeted ? (p.stats?.retweets || 1) - 1 : (p.stats?.retweets || 0) + 1
            }
          };
        }
        return p;
      })
    );

    showToast(isRetweeted ? "Yeniden paylaşım geri alındı" : "Yeniden paylaşıldı 🔄");
  };

  // Toggle Bookmark
  const toggleBookmark = (postId) => {
    const isBookmarked = bookmarks.includes(postId);
    const newBookmarks = isBookmarked
      ? bookmarks.filter((id) => id !== postId)
      : [...bookmarks, postId];

    setBookmarks(newBookmarks);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            stats: {
              ...p.stats,
              bookmarks: isBookmarked ? (p.stats?.bookmarks || 1) - 1 : (p.stats?.bookmarks || 0) + 1
            }
          };
        }
        return p;
      })
    );

    showToast(isBookmarked ? "Yer imlerinden kaldırıldı" : "Yer imlerine kaydedildi 🔖");
  };

  // Toggle Follow User
  const toggleFollow = (userId) => {
    const isFollowed = following.includes(userId);
    const newFollowing = isFollowed
      ? following.filter((id) => id !== userId)
      : [...following, userId];

    setFollowing(newFollowing);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            followers: isFollowed ? (u.followers || 1) - 1 : (u.followers || 0) + 1
          };
        }
        return u;
      })
    );

    showToast(isFollowed ? `@${userId} takipten çıkarıldı` : `@${userId} takip ediliyor ✨`);
  };

  // Add Comment
  const addComment = (postId, text, userName = "misafir_kullanici") => {
    if (!text.trim()) return;
    const newComment = {
      id: "c_" + Date.now(),
      user: userName,
      text: text.trim(),
      time: "Az önce"
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [newComment, ...(p.comments || [])],
            stats: {
              ...p.stats,
              replies: (p.stats?.replies || 0) + 1
            }
          };
        }
        return p;
      })
    );

    if (commentsModalPost && commentsModalPost.id === postId) {
      setCommentsModalPost((curr) => ({
        ...curr,
        comments: [newComment, ...(curr.comments || [])],
        stats: {
          ...curr.stats,
          replies: (curr.stats?.replies || 0) + 1
        }
      }));
    }

    showToast("Yorumunuz eklendi 💬");
  };

  // Add New Post (Simulation)
  const addPost = ({ content, mediaType = "none", mediaUrls = [] }) => {
    const newPost = {
      id: "post-" + Date.now(),
      userId: "kullanici",
      createdAt: "Az önce",
      timestamp: "Şimdi",
      content: content,
      mediaType: mediaType,
      media: mediaUrls.map((url) => ({
        type: mediaType === "video" ? "video" : "image",
        url: url,
        alt: "User media"
      })),
      stats: {
        likes: 0,
        retweets: 0,
        replies: 0,
        views: "1",
        bookmarks: 0
      },
      comments: []
    };

    setPosts([newPost, ...posts]);
    setIsCreatePostOpen(false);
    showToast("Gönderiniz başarıyla paylaşıldı! 🚀");
  };

  // Scraper and Data Management helpers
  const importScrapedData = (newPosts = [], newUsers = null, replaceExisting = false) => {
    if (replaceExisting) {
      setPosts(newPosts);
      if (newUsers) setUsers(Array.isArray(newUsers) ? newUsers : [newUsers]);
    } else {
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = newPosts.filter((p) => !existingIds.has(p.id));
        return [...filteredNew, ...prev];
      });
      if (newUsers) {
        setUsers((prev) => {
          const userArr = Array.isArray(newUsers) ? newUsers : [newUsers];
          const existingIds = new Set(prev.map((u) => u.id));
          const filteredNew = userArr.filter((u) => !existingIds.has(u.id));
          return [...prev, ...filteredNew];
        });
      }
    }
    showToast(`${newPosts.length} gönderi ve profil başarıyla eklendi! 🎉`);
  };

  const deletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast("Gönderi silindi! 🗑️");
  };

  const deleteUserPosts = (userId) => {
    setPosts((prev) => prev.filter((p) => p.userId !== userId));
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(`@${userId} kullanıcısının tüm verileri silindi! 🗑️`);
  };

  const resetToDefaultData = () => {
    setPosts(MOCK_POSTS);
    setUsers(MOCK_USERS);
    localStorage.removeItem("sotwe_scraped_posts");
    localStorage.removeItem("sotwe_scraped_users");
    showToast("Tüm veriler varsayılan haline sıfırlandı! 🔄");
  };

  // Lightbox helpers
  const openLightbox = (mediaList, activeIndex = 0, post = null) => {
    setLightboxData({ mediaList, activeIndex, post });
  };

  const closeLightbox = () => {
    setLightboxData(null);
  };

  // Profile modal helpers
  const openProfile = (userOrId) => {
    let userObj = userOrId;
    if (typeof userOrId === "string") {
      userObj = users.find((u) => u.id === userOrId || u.handle === userOrId);
      if (!userObj) {
        const userPostsCount = posts.filter((p) => p.userId === userOrId).length;
        userObj = {
          id: userOrId,
          name: userOrId,
          handle: userOrId,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${userOrId}`,
          bio: `@${userOrId} Sotwe Videoları ve Paylaşımları`,
          verified: true,
          badgeType: "blue",
          following: 120,
          followers: 4500,
          postsCount: userPostsCount
        };
        setUsers((prev) => [userObj, ...prev]);
      }
    }
    if (userObj) {
      setSelectedUser(userObj);
    }
  };

  const closeProfile = () => {
    setSelectedUser(null);
  };

  // Vertical feed helpers (supports single user filter or all videos)
  const openVerticalFeed = (userId = null, startPostId = null) => {
    setVerticalFeedConfig({ userId, startPostId });
    setSelectedUser(null); // Modal'ı kapat ve akışa geç
    setActiveTab("vertical");
    window.location.hash = "vertical";
  };

  const closeVerticalFeed = () => {
    setVerticalFeedConfig({ userId: null, startPostId: null });
    window.location.hash = "";
    setActiveTab("all");
  };

  return (
    <AppContext.Provider
      value={{
        posts,
        setPosts,
        users,
        setUsers,
        importScrapedData,
        deletePost,
        deleteUserPosts,
        resetToDefaultData,
        bookmarks,
        likes,
        retweets,
        following,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        layoutMode,
        setLayoutMode,
        selectedUser,
        setSelectedUser,
        lightboxData,
        setLightboxData,
        commentsModalPost,
        setCommentsModalPost,
        isCreatePostOpen,
        setIsCreatePostOpen,
        toast,
        showToast,
        toggleLike,
        toggleRetweet,
        toggleBookmark,
        toggleFollow,
        addComment,
        addPost,
        openLightbox,
        closeLightbox,
        openProfile,
        closeProfile,
        verticalFeedConfig,
        setVerticalFeedConfig,
        openVerticalFeed,
        closeVerticalFeed
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
