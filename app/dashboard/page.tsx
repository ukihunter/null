import Addnewbutton from "@/features/dashboard/components/add-new-button";
import Addrepobutton from "@/features/dashboard/components/add-repo-button";
import EmptyState from "@/components/ui/empty-state";
import React from "react";
import Footer from "@/components/ui/footer";
import {
  deleteEdditorSession,
  duplicateEdditorSession,
  editprojectById,
  getEdditorSessionsForUser,
} from "@/features/dashboard/actions";
import ProjectTable from "@/features/dashboard/components/project-table";

const page = async () => {
  const edditors = await getEdditorSessionsForUser();
  return (
    <div className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Addnewbutton />
        <Addrepobutton />
      </div>

      <div className="mt-10 flex flex-col justify-center item-center w-full">
        {edditors && edditors.length == 0 ? (
          <EmptyState
            title="No Editors Found"
            description="Create a new editor to get started."
            imageSrc="/empty.svg"
          />
        ) : (
          <ProjectTable
            //@ts-expect-error TS(2345) FIXME: Argument of type 'EdditorSession[] | null' is not assignable to parameter of type 'Project[]'.
            projects={edditors || []}
            onDeleteProject={deleteEdditorSession}
            onUpdateProject={editprojectById}
            onDuplicateProject={duplicateEdditorSession}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default page;
