"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, Heart, MessageCircle, ArrowRight, Crown } from "lucide-react";
import { CloudinaryImage, Avatar as CloudinaryAvatar } from "@/components/cloudinary-image";

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  readTime: number;
  likes: number;
  comments: number;
  featured: boolean;
  trending: boolean;
  coverImage?: string;
  isPremium?: boolean;
}

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "featured" | "compact";
  className?: string;
}

export function ArticleCard({ article, variant = "default", className }: ArticleCardProps) {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn("hover:shadow-lg transition-all duration-300", className)}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {article.coverImage && (
                <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-md">
                  <CloudinaryImage
                    publicId={article.coverImage}
                    alt={article.title}
                    width={80}
                    height={80}
                    className="object-cover"
                    type="thumbnail"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {article.category}
                  </Badge>
                  <span>•</span>
                  <span>{article.readTime} min read</span>
                </div>
                <h3 className="font-semibold line-clamp-2 text-sm">
                  <Link
                    href={`/article/${article.id}`}
                    className="hover:text-primary transition-colors">
                    {article.title}
                  </Link>
                </h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>{article.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -1 }}
      className="h-full"
    >
      <Card className={cn(
        "group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col",
        isFeatured && "md:col-span-2 lg:col-span-3",
        className
      )}>
        {article.coverImage && (
          <div className={cn(
            "relative overflow-hidden flex-shrink-0",
            isFeatured ? "h-64 md:h-80" : "h-48"
          )}>
            <CloudinaryImage
              publicId={article.coverImage}
              alt={article.title}
              width={isFeatured ? 800 : 400}
              height={isFeatured ? 400 : 200}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              type="cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <Badge 
                variant={article.featured ? "default" : "secondary"}
                className="mb-2"
              >
                {article.category}
              </Badge>
              {article.trending && (
                <Badge variant="destructive" className="ml-2">
                  Trending
                </Badge>
              )}
              {article.isPremium && (
                <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <CardContent className={cn(
          "p-6 flex-1",
          isFeatured && "md:p-8"
        )}>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{article.category}</Badge>
            <span>•</span>
            <span>{article.readTime} min read</span>
            <span>•</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
            {article.trending && (
              <Badge variant="destructive" className="ml-auto">
                <Heart className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {article.isPremium && (
              <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          <h2 className={cn(
            "mb-3 font-bold leading-tight group-hover:text-primary transition-colors",
            isFeatured ? "text-2xl md:text-3xl" : "text-xl"
          )}>
            <Link href={`/article/${article.id}`} className="block">
              {article.title}
            </Link>
          </h2>

          <p className={cn(
            "mb-4 text-muted-foreground line-clamp-3",
            isFeatured ? "text-base" : "text-sm"
          )}>
            {article.excerpt}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.slice(0, isFeatured ? 5 : 3).map((tag) => (
              <motion.div
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge variant="secondary" className="text-xs cursor-pointer">
                  #{tag}
                </Badge>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3">
              {article.author.avatar ? (
                <CloudinaryAvatar
                  publicId={article.author.avatar}
                  alt={article.author.name}
                  size={32}
                />
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {article.author?.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <p className="text-sm font-medium">{article.author.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <motion.div 
                className="flex items-center gap-1"
                whileHover={{ scale: 1.1 }}
              >
                <Heart className="h-4 w-4" />
                <span>{article.likes}</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-1"
                whileHover={{ scale: 1.1 }}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{article.comments}</span>
              </motion.div>
            </div>
          </div>
        </CardContent>

        <CardFooter className={cn(
          "px-6 pb-4 pt-4 mt-auto",
          isFeatured && "md:px-8 md:pb-8"
        )}>
          <motion.div whileHover={{ x: 5 }} className="inline-block">
            <Link
              href={`/article/${article.id}`}
              className="inline-flex items-center text-primary hover:underline font-medium">
              Read more
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}