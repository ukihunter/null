import React from "react";

const Footer = () => {
  return (
    <div className="w-full flex items-center justify-end gap-4 p-4 text-sm text-muted-foreground fixed bottom-0 right-0  ">
      <p>&copy; {new Date().getFullYear()} All rights reserved By Uki_hunter</p>
    </div>
  );
};

export default Footer;
