import React from "react";
import {
  VscFile,
  VscFolder,
  VscFolderOpened,
  VscJson,
  VscMarkdown,
  VscCode,
} from "react-icons/vsc";
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiHtml5,
  SiCss,
  SiPython,
  SiRust,
  SiGo,
  SiPhp,
  SiRuby,
  //SiTailwindcss,
  SiSass,
  SiDocker,
  SiYaml,
  SiSqlite,
  //SiPostgresql,
  SiPrisma,
  //SiAdobephotoshop,
  //SiAdobeillustrator,
} from "react-icons/si";
import { DiJava } from "react-icons/di";
import { VscFileMedia, VscArchive, VscFilePdf } from "react-icons/vsc";

interface FileIconProps {
  extension: string;
  className?: string;
  isFolder?: boolean;
  isOpen?: boolean;
}

const FileIcon = ({
  extension,
  className = "h-4 w-4",
  isFolder,
  isOpen,
}: FileIconProps) => {
  const ext = extension.toLowerCase();

  if (isFolder) {
    return isOpen ? (
      <VscFolderOpened className={`${className} text-blue-400`} />
    ) : (
      <VscFolder className={`${className} text-blue-400`} />
    );
  }

  // VS Code Language Mapping
  switch (ext) {
    case "js":
      return <SiJavascript className={`${className} text-yellow-400`} />;
    case "jsx":
      return <SiReact className={`${className} text-blue-400`} />;
    case "ts":
      return <SiTypescript className={`${className} text-blue-500`} />;
    case "tsx":
      return <SiReact className={`${className} text-cyan-400`} />;
    case "html":
      return <SiHtml5 className={`${className} text-orange-500`} />;
    case "css":
      return <SiCss className={`${className} text-blue-500`} />;
    case "scss":
    case "sass":
      return <SiSass className={`${className} text-pink-500`} />;
    case "json":
      return <VscJson className={`${className} text-yellow-600`} />;
    case "md":
      return <VscMarkdown className={`${className} text-blue-400`} />;
    case "py":
      return <SiPython className={`${className} text-blue-500`} />;
    case "rs":
      return <SiRust className={`${className} text-orange-700`} />;
    case "go":
      return <SiGo className={`${className} text-cyan-600`} />;
    case "php":
      return <SiPhp className={`${className} text-indigo-500`} />;
    case "rb":
      return <SiRuby className={`${className} text-red-500`} />;
    case "java":
      return <DiJava className={`${className} text-red-600`} />;
    case "sql":
      return <SiSqlite className={`${className} text-blue-500`} />;
    case "prisma":
      return <SiPrisma className={`${className} text-blue-900`} />;
    case "yml":
    case "yaml":
      return <SiYaml className={`${className} text-purple-500`} />;
    case "dockerfile":
      return <SiDocker className={`${className} text-blue-500`} />;
    case "env":
      return <VscCode className={`${className} text-yellow-500`} />;
    case "svg":
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
      return <VscFileMedia className={`${className} text-purple-500`} />;
    case "pdf":
      return <VscFilePdf className={`${className} text-red-500`} />;
    case "zip":
    case "rar":
    case "tar":
    case "gz":
      return <VscArchive className={`${className} text-gray-500`} />;
    default:
      return <VscFile className={`${className} text-gray-400`} />;
  }
};

export default FileIcon;
