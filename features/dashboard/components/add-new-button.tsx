"use client";
import React from "react";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Image from "next/image";

import { useState } from "react";

import TemplateselectionModel from "./template-selector-model";
import { toast } from "sonner";
import { createEdditorsession } from "../actions";
import { Templates } from "@prisma/client";

const Addnewbutton = () => {
  const [isModelOpen, setIsModelOpen] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    template:
      | "REACT"
      | "NEXTJS"
      | "EXPRESS"
      | "REACT_NATIVE"
      | "HONO"
      | "VUE"
      | "ANGULAR"
      | "SVELTE";
    description?: string;
  }) => {
    // Map REACT to REACTJS for Prisma
    const template = data.template === "REACT" ? "REACTJS" : data.template;

    const res = await createEdditorsession({
      title: data.title,
      description: data.description || "",
      template: template as Templates,
      userId: "", // This is ignored - user is fetched from session in the action
    });
    toast("Editor created successfully");
    console.log("Creating new session:", data);
    setIsModelOpen(false);
    return res?.id ?? ""; // Return the project ID so template-selector-model can navigate
  };
  return (
    <>
      <div
        onClick={() => setIsModelOpen(true)}
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
          >
            <Plus
              size={30}
              className="transition-transform duration-300 group-hover:rotate-90"
            />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#ff6585]">Add New</h1>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              Create a new Project
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <Image
            src={"/add.svg"}
            alt="Create new Project"
            width={150}
            height={150}
            className="transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      </div>
      <TemplateselectionModel
        isOpen={isModelOpen}
        onClose={() => setIsModelOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default Addnewbutton;
