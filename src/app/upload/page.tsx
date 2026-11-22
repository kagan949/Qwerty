import type { Metadata } from "next";
import { UploadView } from "@/components/upload/upload-view";

export const metadata: Metadata = {
  title: "Upload Music",
  description: "Add your own MP3, FLAC, WAV and M4A files. Stored privately on your device and playable offline.",
};

export default function UploadPage() {
  return <UploadView />;
}
