"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Filter, 
  TrendingUp, 
  Clock, 
  Heart,
  ChevronDown 
} from "lucide-react";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: "latest" | "trending" | "popular";
  onSortChange: (sort: "latest" | "trending" | "popular") => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: CategoryFilterProps) {
  const sortOptions = [
    { value: "latest", label: "Latest", icon: Clock },
    { value: "trending", label: "Trending", icon: TrendingUp },
    { value: "popular", label: "Popular", icon: Heart },
  ] as const;

  const selectedSort = sortOptions.find(option => option.value === sortBy);
  const SortIcon = selectedSort?.icon || Clock;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange("all")}
        >
          All Articles
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SortIcon className="h-4 w-4" />
            Sort by: {selectedSort?.label}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}