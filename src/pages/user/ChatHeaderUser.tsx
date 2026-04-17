import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, X } from "lucide-react"; 
import { getInitials } from "@/components/chat/chat.utils";
import { SettingSheet } from "@/components/chat/SettingSheet";
import { useAuth } from "@/hooks/useAuth";
import { UserUpgrade } from "@/components/UserUpgrade";

export default function ChatHeaderUser() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-card shadow-sm">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="relative shrink-0">
          <motion.div
            layoutId="avatar-image"
            onClick={() => setIsExpanded(true)}
            className="cursor-pointer"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src="/AhmedZakiLogo2.jpg" />
              <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
                {getInitials("Ahmed Zaki")}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate leading-tight">
            Ahmed Zaki
          </p>
          <p className="text-xs truncate leading-tight mt-0.5 text-muted-foreground italic">
            Usually respond in less than a day.
          </p>
        </div>
      </div>

      <div className="flex items-center shrink-0">
        {!user?.email && <UserUpgrade />}
        <SettingSheet>
          <MoreVertical className="h-4 w-4" />
        </SettingSheet>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              layoutId="avatar-image"
              className="relative z-10 w-full max-w-sm aspect-square bg-card rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src="/AhmedZakiLogo2.jpg"
                alt="Ahmed Zaki"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
