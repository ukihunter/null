"use client";

import React from "react";
import { useParams } from "next/navigation";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useEditor } from "@/features/edditor/hook/useEditor";
import TemplateFileTree from "@/features/edditor/components/template-file-tree";

const Page = () => {
  const { id } = useParams() as { id?: string };
  const { editorData, templateData } = useEditor(id || "");
  console.log(templateData);
  console.log(editorData);
  return (
    <div>
      <>
        <TemplateFileTree data={templateData} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center gap-2 ">
              <div className="flex flex-col flex-1">
                {editorData?.title || " Null Edditor"}
              </div>
            </div>
          </header>
        </SidebarInset>
      </>
    </div>
  );
};

export default Page;
