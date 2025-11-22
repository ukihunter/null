"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  Search,
  Star,
  Code,
  Server,
  Globe,
  Zap,
  Clock,
  Check,
  Plus,
  TabletSmartphone,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import EmptyState from "@/components/ui/empty-state";

// TemplateSelectionModal.tsx
type TemplateSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    template:
      | "REACT"
      | "NEXTJS"
      | "EXPRESS"
      | "VUE"
      | "HONO"
      | "ANGULAR"
      | "REACT_NATIVE"
      | "SVELTE";
    description?: string;
  }) => void;
};

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  popularity: number;
  tags: string[];
  features: string[];
  category: "frontend" | "backend" | "fullstack" | "mobile";
}

const templates: TemplateOption[] = [
  {
    id: "react",
    name: "React",
    description:
      "A JavaScript library for building user interfaces with component-based architecture",
    icon: "/react.svg",
    color: "#61DAFB",
    popularity: 5,
    tags: ["UI", "Frontend", "JavaScript"],
    features: ["Component-Based", "Virtual DOM", "JSX Support"],
    category: "frontend",
  },
  {
    id: "nextjs",
    name: "Next.js",
    description:
      "The React framework for production with server-side rendering and static site generation",
    icon: "/nextjs-icon.svg",
    color: "#000000",
    popularity: 4,
    tags: ["React", "SSR", "Fullstack"],
    features: ["Server Components", "API Routes", "File-based Routing"],
    category: "fullstack",
  },
  {
    id: "express",
    name: "Express",
    description:
      "Fast, unopinionated, minimalist web framework for Node.js to build APIs and web applications",
    icon: "/expressjs-icon.svg",
    color: "#000000",
    popularity: 4,
    tags: ["Node.js", "API", "Backend"],
    features: ["Middleware", "Routing", "HTTP Utilities"],
    category: "backend",
  },
  {
    id: "vue",
    name: "Vue.js",
    description:
      "Progressive JavaScript framework for building user interfaces with an approachable learning curve",
    icon: "/vuejs-icon.svg",
    color: "#4FC08D",
    popularity: 4,
    tags: ["UI", "Frontend", "JavaScript"],
    features: ["Reactive Data Binding", "Component System", "Virtual DOM"],
    category: "frontend",
  },
  {
    id: "hono",
    name: "Hono",
    description:
      "Fast, lightweight, built on Web Standards. Support for any JavaScript runtime.",
    icon: "/hono.svg",
    color: "#e36002",
    popularity: 3,
    tags: ["Node.js", "TypeScript", "Backend"],
    features: [
      "Dependency Injection",
      "TypeScript Support",
      "Modular Architecture",
    ],
    category: "backend",
  },
  {
    id: "angular",
    name: "Angular",
    description:
      "Angular is a web framework that empowers developers to build fast, reliable applications.",
    icon: "/angular-2.svg",
    color: "#DD0031",
    popularity: 3,
    tags: ["React", "Fullstack", "JavaScript"],
    features: [
      "Reactive Data Binding",
      "Component System",
      "Virtual DOM",
      "Dependency Injection",
      "TypeScript Support",
    ],
    category: "fullstack",
  },

  {
    id: "react_native",
    name: "React Native",
    description: "Build native mobile apps using React.",
    icon: "/react-native.svg",
    color: "#61DAFB",
    popularity: 4,
    tags: ["Mobile", "React"],
    features: ["Cross-Platform", "Native Rendering"],
    category: "mobile",
  },
  {
    id: "svelte",
    name: "Svelte",
    description: "Compiler-based UI framework with minimal overhead.",
    icon: "/svelte.svg",
    color: "#ff3e00",
    popularity: 4,
    tags: ["Frontend", "Compiler"],
    features: ["Reactivity", "No Virtual DOM"],
    category: "frontend",
  },
];
const TemplateSelectorModel = ({
  isOpen,
  onClose,
  onSubmit,
}: TemplateSelectionModalProps) => {
  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<
    "all" | "frontend" | "backend" | "fullstack" | "mobile"
  >("all");
  const [projectName, setProjectName] = useState("");

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      category === "all" || template.category === category;

    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      setStep("configure");
    }
  };

  const handleCreateProject = () => {
    if (selectedTemplate) {
      const templateMap: Record<
        string,
        | "REACT"
        | "NEXTJS"
        | "EXPRESS"
        | "VUE"
        | "HONO"
        | "ANGULAR"
        | "REACT_NATIVE"
        | "SVELTE"
      > = {
        react: "REACT",
        nextjs: "NEXTJS",
        express: "EXPRESS",
        vue: "VUE",
        hono: "HONO",
        angular: "ANGULAR",
        react_native: "REACT_NATIVE",
        svelte: "SVELTE",
      };

      const template = templates.find((t) => t.id === selectedTemplate);
      onSubmit({
        title: projectName || `New ${template?.name} Project`,
        template: templateMap[selectedTemplate] || "REACT",
        description: template?.description,
      });

      console.log(
        `Creating ${projectName || "new project"} with template: ${
          template?.name
        }`
      );
      onClose();
      // Reset state for next time
      setStep("select");
      setSelectedTemplate(null);
      setProjectName("");
    }
  };

  const handleBack = () => {
    setStep("select");
  };

  const renderStars = (count: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < count ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }
        />
      ));
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          // Reset state when closing
          setStep("select");
          setSelectedTemplate(null);
          setProjectName("");
        }
      }}
    >
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh]">
        {step === "select" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#e93f3f] flex items-center gap-2">
                <Plus size={24} className="text-[#e93f3f]" />
                Select a Template
              </DialogTitle>
              <DialogDescription>
                Choose a template to create your new playground
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 outline-none"
                    size={18}
                  />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Tabs
                  defaultValue="all"
                  className="w-full sm:w-auto"
                  onValueChange={(value) => setCategory(value as any)}
                >
                  <TabsList className="grid grid-cols-5 w-full sm:w-[400px]">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="frontend">Frontend</TabsTrigger>
                    <TabsTrigger value="backend">Backend</TabsTrigger>
                    <TabsTrigger value="fullstack">Fullstack</TabsTrigger>
                    <TabsTrigger value="mobile">Mobile</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <RadioGroup
                value={selectedTemplate || ""}
                onValueChange={handleSelectTemplate}
              >
                {/* Wrap the existing grid in a scrollable container */}
                <div className="max-h-[50vh] overflow-y-auto pr-2 pl-2  scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-transparent hover:scrollbar-thumb-red-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 mt-2 ">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`relative flex p-6 border rounded-lg cursor-pointer
              transition-all duration-300 hover:scale-[1.02]
              ${
                selectedTemplate === template.id
                  ? "border-[#E93F3F]  shadow-[0_0_0_1px_#E93F3F,0_8px_20px_rgba(233,63,63,0.15)]"
                  : "hover:border-[#E93F3F] shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
              }`}
                          onClick={() => handleSelectTemplate(template.id)}
                        >
                          <div className="absolute top-4 right-4 flex gap-1">
                            {renderStars(template.popularity)}
                          </div>

                          {selectedTemplate === template.id && (
                            <div className="absolute top-2 left-2 bg-[#E93F3F] text-white rounded-full p-1">
                              <Check size={14} />
                            </div>
                          )}

                          <div className="flex gap-4">
                            <div
                              className="relative w-16 h-16  flex items-center justify-center rounded-full"
                              style={{ backgroundColor: `${template.color}15` }}
                            >
                              <Image
                                src={template.icon || "/placeholder.svg"}
                                alt={`${template.name} icon`}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            </div>

                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold">
                                  {template.name}
                                </h3>
                                <div className="flex gap-1">
                                  {template.category === "frontend" && (
                                    <Code size={14} className="text-blue-500" />
                                  )}
                                  {template.category === "backend" && (
                                    <Server
                                      size={14}
                                      className="text-green-500"
                                    />
                                  )}
                                  {template.category === "fullstack" && (
                                    <Globe
                                      size={14}
                                      className="text-purple-500"
                                    />
                                  )}
                                  {template.category === "mobile" && (
                                    <TabletSmartphone
                                      size={14}
                                      className="text-yellow-500"
                                    />
                                  )}
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground mb-3">
                                {template.description}
                              </p>

                              <div className="flex flex-wrap gap-2 mt-auto">
                                {template.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-2 py-1 border rounded-2xl"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <RadioGroupItem
                            value={template.id}
                            id={template.id}
                            className="sr-only"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2  items-center justify-center text-center">
                        <EmptyState
                          title="No templates found"
                          description="plase try adjusting your search or filters."
                          imageSrc="/empty.svg"
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center justify-center mt-2 mb-2">
                    More Coming Soon
                  </span>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between gap-3 mt-4 pt-4 border-t">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock size={14} className="mr-1" />
                <span>
                  Estimated setup time:{" "}
                  {selectedTemplate ? "2-5 minutes" : "Select a template"}
                </span>
                <span className="text-xs font-semibold text-[#E93F3F] ml-4 flex flex-row items-center">
                  <Info size={12} className="inline-block mr-1 " />
                  This can be depend on your internet speed
                </span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#E93F3F] hover:bg-[#d03636]"
                  disabled={!selectedTemplate}
                  onClick={handleContinue}
                >
                  Continue <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#e93f3f]">
                Configure Your Project
              </DialogTitle>
              <DialogDescription>
                {templates.find((t) => t.id === selectedTemplate)?.name} project
                configuration
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="my-awesome-project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="p-4 shadow-[0_0_0_1px_#E93F3F,0_8px_20px_rgba(233,63,63,0.15)] rounded-lg border">
                <h3 className="font-medium mb-2">Selected Template Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates
                    .find((t) => t.id === selectedTemplate)
                    ?.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Zap size={14} className="text-[#E93F3F]" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                className="bg-[#E93F3F] hover:bg-[#d03636]"
                onClick={handleCreateProject}
              >
                Create Project
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectorModel;
