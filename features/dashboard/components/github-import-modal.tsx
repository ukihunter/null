"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2 } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
};

const GithubImportModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a GitHub URL.");
      return;
    }

    // Basic URL validation
    if (!trimmed.match(/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/)) {
      setError(
        "Invalid GitHub URL. Example: https://github.com/owner/repository",
      );
      return;
    }

    setLoading(true);
    try {
      await onSubmit(trimmed);
      setUrl("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setUrl("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-[#ff6585]" />
            <DialogTitle>Import from GitHub</DialogTitle>
          </div>
          <DialogDescription>
            The files will be imported into your editor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="github-url">Repository URL</Label>
            <Input
              id="github-url"
              type="url"
              placeholder="https://github.com/owner/repository"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              disabled={loading}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <p className="text-xs text-[#CD2604]">
            Supports public repos. privet repo is currently not supported. Make
            sure to include the full URL.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-[#ff6585] hover:bg-[#e0506f] text-white border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                "Import"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GithubImportModal;
