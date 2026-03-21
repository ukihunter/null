"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MarkedToggleButtonProps {
  markedForRevision?: boolean;
  id: string;
  onToggle?: (isMarked: boolean) => void;
  toggleFunction: (
    id: string,
  ) => Promise<{ success?: boolean; isMarked?: boolean; error?: string }>;
}

export default function MarkedToggleButton({
  markedForRevision = false,
  id,
  onToggle,
  toggleFunction,
}: MarkedToggleButtonProps) {
  const router = useRouter();
  const [isMarked, setIsMarked] = useState(markedForRevision);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await toggleFunction(id);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      if (result.success && result.isMarked !== undefined) {
        setIsMarked(result.isMarked);
        onToggle?.(result.isMarked);
        toast.success(result.isMarked ? "Project starred!" : "Star removed!");

        // Refresh the entire page to update sidebar
        router.refresh();
      }
    } catch (error) {
      console.error("Error toggling star:", error);
      toast.error("Failed to update star status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className="flex items-center gap-2 w-full justify-start"
    >
      <Star
        className={`h-4 w-4 ${
          isMarked ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
        }`}
      />
      <span>{isMarked ? "Unstar Project" : "Star Project"}</span>
    </Button>
  );
}
