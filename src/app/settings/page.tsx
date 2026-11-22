import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Language, theme, playback, storage and backups for VYBE.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
