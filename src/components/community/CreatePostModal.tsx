import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageUrl?: string) => void;
  posting: boolean;
  channelLabel: string;
}

const CreatePostModal = ({ open, onClose, onSubmit, posting, channelLabel }: CreatePostModalProps) => {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    // Compress before preview and upload
    file = await compressImage(file, { maxDimension: 1200, quality: 0.8, maxSizeKB: 500 });
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;

    let imageUrl: string | undefined;

    if (imageFile) {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUploading(false); return; }

      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("community-images")
        .upload(path, imageFile);

      if (error) {
        toast.error("Failed to upload image");
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("community-images")
        .getPublicUrl(path);
      imageUrl = urlData.publicUrl;
      setUploading(false);
    }

    onSubmit(content, imageUrl);
    setContent("");
    setImageFile(null);
    setImagePreview(null);
  };

  const isDisabled = (!content.trim() && !imageFile) || posting || uploading;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] rounded-t-3xl p-5 pb-[max(env(safe-area-inset-bottom,32px),32px)]"
            style={{ background: "hsl(var(--surface))" }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "hsl(var(--border-subtle))" }} />
            <h3 className="font-serif text-[20px] mb-2" style={{ color: "hsl(var(--dark))" }}>Share with the community</h3>
            <p className="text-[13px] font-sans mb-4" style={{ color: "hsl(var(--text-muted))" }}>
              Posting to <span className="font-semibold" style={{ color: "hsl(var(--green))" }}>{channelLabel}</span>
            </p>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={1000}
              rows={4}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl text-[15px] font-sans outline-none resize-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border-subtle))" }}
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-3">
                <img src={imagePreview} alt="Preview" className="w-full h-[160px] object-cover rounded-2xl" />
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  <IonIcon name="close" size={16} style={{ color: "white" }} />
                </motion.button>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-3 mt-3">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ background: "hsl(var(--bg))" }}
              >
                <IonIcon name="camera-outline" size={18} style={{ color: "hsl(var(--green))" }} />
                <span className="text-[13px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>Photo</span>
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={isDisabled}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans mt-4"
              style={{ background: "hsl(var(--green))", color: "white", opacity: isDisabled ? 0.6 : 1 }}
            >
              {uploading ? "Uploading…" : posting ? "Posting…" : "Post"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
