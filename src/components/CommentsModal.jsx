import React, { useState } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { parseTweetText } from "../utils/formatters";

export default function CommentsModal() {
  const { commentsModalPost, setCommentsModalPost, addComment, users, openProfile } = useApp();
  const [commentText, setCommentText] = useState("");

  if (!commentsModalPost) return null;

  const post = commentsModalPost;
  const user = users.find((u) => u.id === post.userId) || {
    name: post.userId,
    handle: post.userId,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText("");
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={() => setCommentsModalPost(null)}
    >
      <div 
        className="glass-modal w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] my-auto border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-slate-200" />
            <h3 className="font-bold text-white text-base">Yanıtlar & Yorumlar</h3>
          </div>
          <button
            onClick={() => setCommentsModalPost(null)}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-black/40 border-b border-white/10 flex gap-3">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer ring-1 ring-white/10"
            onClick={() => {
              setCommentsModalPost(null);
              openProfile(user);
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{user.name}</span>
              <span className="text-xs text-slate-400">@{user.handle}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-3">
              {parseTweetText(post.content, (h) => openProfile(h))}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment) => (
              <div 
                key={comment.id} 
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#1c1c1c] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">
                  {comment.user.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">@{comment.user}</span>
                    <span className="text-[11px] text-slate-500">{comment.time}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed break-words">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">
              İlk yorumu siz yapın!
            </div>
          )}
        </div>

        <form 
          onSubmit={handleSubmit}
          className="p-3.5 bg-black border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Yanıtınızı yazın..."
            className="flex-1 px-4 py-2.5 rounded-full bg-[#1c1c1c] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/30 transition-colors"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2.5 rounded-full bg-[#212121] hover:bg-[#2d2d2d] disabled:opacity-40 text-white border border-white/15 transition-all shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
