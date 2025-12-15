"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "warning" | "danger" | "success";
  onClick?: () => void;
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

export function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  onClick,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        variantStyles[variant],
        onClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", iconStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", valueStyles[variant])}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
