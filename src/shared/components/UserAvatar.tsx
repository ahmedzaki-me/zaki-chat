import { useState, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { getInitials } from "@/features/chat/utils/chat.utils";
import { cn } from "@/shared/lib/utils";

const retriedUrls = new Set<string>();
type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
  onExpired?: () => void;
  children?: ReactNode;
};

export function UserAvatar({
  name,
  avatarUrl,
  size = "default",
  className,
  onExpired,
  children,
}: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!avatarUrl && failedUrl !== avatarUrl;
  return (
    <Avatar size={size} className={cn(className)}>
      {showImage && (
        <AvatarImage
          key={avatarUrl}
          src={avatarUrl}
          alt={`${name}'s avatar`}
          onError={() => {
            setFailedUrl(avatarUrl!);
            if (!retriedUrls.has(avatarUrl!)) {
              retriedUrls.add(avatarUrl!);
              onExpired?.();
            }
          }}
        />
      )}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
      {children}
    </Avatar>
  );
}
