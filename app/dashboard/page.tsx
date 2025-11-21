import Addnewbutton from "@/features/dashboard/components/add-new-button";
import Addrepobutton from "@/features/dashboard/components/add-repo-button";
import EmptyState from "@/components/ui/empty-state";
import React from "react";
import Footer from "@/components/ui/footer";

const page = () => {
  const edditors: any[] = [];
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
          <p>hahah</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default page;
