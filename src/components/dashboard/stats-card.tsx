"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "warning" | "danger" | "success";
  size?: "default" | "large";
  onClick?: () => void;
  percentage?: number;
}

const variantStyles = {
  default: "bg-card",
  warning: "bg-yellow-50 border-yellow-200",
  danger: "bg-red-50 border-red-200",
  success: "bg-green-50 border-green-200",
};

const iconStyles = {
  default: "text-muted-foreground",
  warning: "text-yellow-600",
  danger: "text-red-600",
  success: "text-green-600",
};

const valueStyles = {
  default: "text-foreground",
  warning: "text-yellow-700",
  danger: "text-red-700",
  success: "text-green-700",
};

const sizeStyles = {
  default: {
    card: "",
    icon: "h-4 w-4",
    value: "text-3xl",
    title: "text-sm",
  },
  large: {
    card: "md:col-span-2 border-2",
    icon: "h-6 w-6",
    value: "text-4xl md:text-5xl",
    title: "text-base",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  size = "default",
  onClick,
  percentage,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        variantStyles[variant],
        sizeStyles[size].card,
        onClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(sizeStyles[size].title, "font-medium")}>
          {title}
        </CardTitle>
        <Icon className={cn(sizeStyles[size].icon, iconStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className={cn(sizeStyles[size].value, "font-bold", valueStyles[variant])}>
            {value}
          </div>
          {percentage !== undefined && (
            <span className="text-sm text-muted-foreground font-medium">
              ({percentage}%)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
