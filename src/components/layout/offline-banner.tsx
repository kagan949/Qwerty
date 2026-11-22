"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useI18n } from "@/i18n/provider";

export function OfflineBanner() {
  const online = useNetworkStatus();
  const { t } = useI18n();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative z-40 overflow-hidden border-b border-amber-400/20 bg-amber-500/10 text-amber-200"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium">
            <WifiOff className="size-3.5" />
            {t("pwa.offlineBanner")}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
