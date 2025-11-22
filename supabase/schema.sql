-- OneStream Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL CHECK (char_length(text) <= 280),
  "authorAddress" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "tokenId" INTEGER,
  "tokenUri" TEXT,
  "mintStatus" TEXT NOT NULL DEFAULT 'pending' CHECK ("mintStatus" IN ('pending', 'success', 'failed')),
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "posts_tokenId_unique" UNIQUE ("tokenId")
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "postId" UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "userAddress" TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("postId", "userAddress")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts("createdAt" ASC);
CREATE INDEX IF NOT EXISTS idx_posts_authorAddress ON posts("authorAddress");
CREATE INDEX IF NOT EXISTS idx_posts_tokenId ON posts("tokenId");
CREATE INDEX IF NOT EXISTS idx_reactions_postId ON reactions("postId");
CREATE INDEX IF NOT EXISTS idx_reactions_userAddress ON reactions("userAddress");

-- Row Level Security (RLS) policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to posts
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Allow authenticated users to insert posts (will be enforced by API)
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own posts (enforced by API with on-chain check)
CREATE POLICY "Users can update posts" ON posts
  FOR UPDATE USING (true);

-- Allow users to delete their own posts (enforced by API with on-chain check)
CREATE POLICY "Users can delete posts" ON posts
  FOR DELETE USING (true);

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create reactions" ON reactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own reactions" ON reactions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own reactions" ON reactions
  FOR DELETE USING (true);

