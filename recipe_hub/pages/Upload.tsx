import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  Upload as UploadIcon,
  FileUp,
  Plus,
  Trash2,
  ListChecks,
  Utensils,
  Check
} from "lucide-react";

import { Page, Video, InstructionStep } from "../types";
import { createVideoApi } from "../api";

interface UploadPageProps {
  onNavigate: (page: Page) => void;
  onUpload?: (video: Video) => void;
  userName: string;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  onNavigate,
  onUpload,
  userName
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [duration, setDuration] = useState("00:00");

  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [instructions, setInstructions] = useState<InstructionStep[]>([
    { title: "", text: "" }
  ]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleIngredientChange = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const handleAddStep = () => {
    setInstructions([...instructions, { title: "", text: "" }]);
  };

  const handleRemoveStep = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const handleStepChange = (
    index: number,
    field: keyof InstructionStep,
    value: string
  ) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], [field]: value };
    setInstructions(updated);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Calculate duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const mins = Math.floor(video.duration / 60);
        const secs = Math.floor(video.duration % 60);
        setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile || !thumbnailFile) {
      toast.error("Please upload both video and thumbnail.");
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      const formData = new FormData();

      formData.append("video_file", videoFile);
      formData.append("thumbnail_file", thumbnailFile);

      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", selectedCategory || "Popular");
      formData.append("duration", duration);

      const cleanIngredients = ingredients.filter((i) => i.trim() !== "");

      cleanIngredients.forEach((ing) => {
        formData.append("ingredients", ing.trim());
      });

      const stepsArray = instructions
        .map((s) => s.text)
        .join("\n")
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      stepsArray.forEach((step) => {
        formData.append("instructions", step);
      });
      const apiVideo = await createVideoApi(formData, (percent?: number) => {
        if (typeof percent === "number") {
          setUploadProgress(percent);
        }
      });

      const newVideo: Video = {
        id: apiVideo.id,
        title: apiVideo.title,
        creator: userName,
        views: "0 views",
        postedTime: "Just now",
        duration: apiVideo.duration || duration,
        thumbnail: apiVideo.thumbnail_url || "",
        category: selectedCategory || "Popular",
        description: apiVideo.description,
        status: "approved"
      } as any;

      onUpload?.(newVideo);

      setUploadProgress(100);

      toast.success("Recipe uploaded successfully!");

      onNavigate("home");
    } catch (err: any) {
      console.error("Upload error:", err);

      toast.error(err.message || "Failed to upload recipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="mb-10">
        <h1 className="text-5xl font-black mb-4">Upload Recipe</h1>
        <p className="text-zinc-500 text-lg">
          Upload your recipe video.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-12">

        {/* VIDEO + THUMBNAIL */}
        <section className="bg-white/40 border-2 border-white rounded-[48px] p-10 space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div className="relative border-2 border-dashed border-zinc-400 rounded-[32px] p-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#a832d3] transition-colors">

              {videoFile ? (
                <Check className="text-emerald-500" size={32} />
              ) : (
                <FileUp size={32} className="text-zinc-500" />
              )}

              <p className="mt-3 font-bold text-zinc-700 truncate max-w-full px-4 text-center">
                {videoFile ? videoFile.name : "Choose Video"}
              </p>

              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="video/*"
                onChange={handleVideoChange}
              />
            </div>

            <div className="relative border-2 border-dashed border-zinc-400 rounded-[32px] p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#a832d3] transition-colors">

              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  className="w-40 h-40 object-cover rounded-2xl"
                  alt="Thumbnail Preview"
                />
              ) : (
                <UploadIcon size={32} className="text-zinc-500" />
              )}

              <p className="mt-3 font-bold text-zinc-700">Choose Thumbnail</p>

              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*"
                onChange={handleThumbnailChange}
              />
            </div>
          </div>

          {/* TITLE */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe Title"
            className="w-full bg-white border-2 border-zinc-100 rounded-xl p-4 font-bold focus:border-[#a832d3] outline-none transition-colors"
            required
          />

          {/* DESCRIPTION */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full bg-white border-2 border-zinc-100 rounded-xl p-4 min-h-[120px] focus:border-[#a832d3] outline-none transition-colors"
          />

          {/* CATEGORY DROPDOWN */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Category</label>
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border-2 border-zinc-100 rounded-xl p-4 font-bold focus:border-[#a832d3] outline-none transition-colors appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Select Category</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Drinks">Drinks</option>
              <option value="Dessert">Dessert</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </section>

        {/* INGREDIENTS */}

        <section className="space-y-4">

          <div className="flex justify-between items-center mb-2">

            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400">Ingredients</h2>

            <button type="button" onClick={handleAddIngredient} className="p-2 bg-white rounded-full shadow-sm hover:text-[#a832d3] transition-colors">
              <Plus size={20} />
            </button>

          </div>

          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">

                <input
                  value={ing}
                  onChange={(e) =>
                    handleIngredientChange(idx, e.target.value)
                  }
                  placeholder={`Ingredient ${idx + 1}`}
                  className="flex-1 bg-white border-2 border-zinc-100 p-4 rounded-xl font-bold focus:border-[#a832d3] outline-none transition-colors"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(idx)}
                  className="p-4 text-zinc-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>

              </div>
            ))}
          </div>

        </section>

        {/* INSTRUCTIONS */}

        <section className="space-y-6">

          <div className="flex justify-between items-center mb-2">

            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400">Instructions</h2>

            <button type="button" onClick={handleAddStep} className="px-4 py-2 bg-white rounded-xl shadow-sm font-black text-xs hover:text-[#a832d3] transition-colors">
              ADD STEP
            </button>

          </div>

          <div className="space-y-6">
            {instructions.map((step, idx) => (

              <div key={idx} className="bg-white p-8 rounded-[32px] space-y-4 border-2 border-zinc-50 relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="absolute -left-3 top-8 w-8 h-8 bg-[#a832d3] text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg">
                  {idx + 1}
                </div>

                <input
                  value={step.title}
                  onChange={(e) =>
                    handleStepChange(idx, "title", e.target.value)
                  }
                  placeholder="Step Title (e.g. Preparation)"
                  className="w-full text-lg font-black bg-transparent border-b-2 border-zinc-100 focus:border-[#a832d3] outline-none pb-2 transition-colors"
                />

                <textarea
                  value={step.text}
                  onChange={(e) =>
                    handleStepChange(idx, "text", e.target.value)
                  }
                  placeholder="Describe this step in detail..."
                  className="w-full bg-zinc-50 p-4 rounded-2xl min-h-[100px] font-medium focus:bg-white border-2 border-transparent focus:border-[#a832d3] outline-none transition-all"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveStep(idx)}
                  className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>

            ))}
          </div>

        </section>

        <div className="flex flex-col items-end gap-6 pt-8 border-t border-white/40">
          {isSubmitting && (
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-zinc-500 px-2">
                <span>Uploading Recipe...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden border border-white shadow-inner p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#a832d3] to-[#F6CEFC] rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(168,50,211,0.3)]"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#a832d3] text-white px-20 py-6 rounded-full text-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 flex items-center gap-4"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                UPLOADING {uploadProgress}%
              </>
            ) : (
              <>
                <ListChecks size={24} />
                PUBLISH RECIPE
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};