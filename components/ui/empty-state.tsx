import React from "react";
import Image from "next/image";
interface Props {
  title?: string;
  description?: string;
  imageSrc?: string;
}

const Empty = ({ title, description, imageSrc }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {imageSrc && (
        <Image
          src={imageSrc}
          alt="Empty state"
          className="w-78 h-78 mb-4"
          height={120}
          width={120}
        />
      )}
      <h2 className="text-xl font-semibold mb-2 text-gray-500">{title}</h2>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export default Empty;
