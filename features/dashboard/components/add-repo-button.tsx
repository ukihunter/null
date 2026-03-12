"use client";
import React from "react";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import GithubImportModal from "./github-import-modal";
import { importGithubRepo } from "../actions";

const Addrepobutton = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImport = async (url: string) => {
    const res = await importGithubRepo(url);

    if (!res.success) {
      const messages: Record<string, string> = {
        not_authenticated: "You must be signed in to import a repository.",
        user_not_in_db: "Account not found. Please sign out and sign back in.",
        invalid_url:
          "Invalid GitHub URL. Example: https://github.com/owner/repo",
        repo_not_found:
          "Repository not found. Make sure the URL is correct and the repo is public.",
        rate_limited:
          "GitHub API rate limit reached. Add a GITHUB_TOKEN env variable or try again later.",
        no_files_found: "No importable text files found in this repository.",
        db_error: "Database error. Please try again.",
      };
      toast.error(
        messages[res.reason] ??
          "Failed to import repository. Please try again.",
      );
      throw new Error(res.reason);
    }

    toast.success("Repository imported successfully!");
    setIsModalOpen(false);
    router.push(`/editor/${res.data.id}`);
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group px-6 py-6 flex flex-row justify-between items-center border rounded-lg bg-muted cursor-pointer 
        transition-all duration-300 ease-in-out
        hover:bg-background hover:border-[#f0627f] hover:scale-[1.02]
         shadow-[0_2px_10px_rgba(0,0,0,0.08)]
        hover:shadow-[0_10px_30px_rgba(233,63,63,0.15)]"
      >
        <div className="flex flex-row justify-center items-start gap-4">
          <Button
            variant={"outline"}
            className="flex justify-center items-center bg-white group-hover:bg-[#ff6585] group-hover:border-[#ff6585] group-hover:text-[#ff6585] transition-colors duration-300"
            size={"icon"}
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
          >
            <Plus
              size={30}
              className="transition-transform duration-300 group-hover:rotate-90"
            />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#ff6585]">Add New</h1>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              Open a GitHub repository and work on it.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <Image
            src={"/repo.svg"}
            alt="Create new Repo"
            width={150}
            height={150}
            className="transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      </div>

      <GithubImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleImport}
      />
    </>
  );
};

export default Addrepobutton;
