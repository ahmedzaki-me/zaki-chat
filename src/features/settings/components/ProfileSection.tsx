import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { AvatarSettings } from "@/features/settings/components/AvatarSettings";
import { UserUpgrade } from "@/features/auth/components/UserUpgrade";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getCurrentUser } from "@/features/auth/api/auth.service";
import { getProblemMessage } from "@/shared/lib/problemDetails";

export const accountKey = ["auth", "me"] as const;

export function ProfileSection() {
  const { user: authUser } = useAuth();
  const client = useQueryClient();
  const account = useQuery({ queryKey: accountKey, queryFn: getCurrentUser });
  useEffect(() => {
    if (authUser) client.setQueryData(accountKey, { user: authUser });
  }, [authUser, client]);
  const profile = account.data?.user ?? authUser;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your account details and profile photo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile && (
          <AvatarSettings name={profile.name} avatarUrl={profile.avatarUrl} />
        )}
        {account.isPending && !profile ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        ) : (
          account.isError && (
            <div className="space-y-2" role="alert">
              <p className="text-sm text-destructive">
                {getProblemMessage(account.error)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void account.refetch()}
              >
                Retry profile
              </Button>
            </div>
          )
        )}
        {profile && (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{profile.name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">Username</p>
              {profile.username ? (
                <span className="font-medium">@{profile.username}</span>
              ) : (
                <Badge variant="secondary">Guest</Badge>
              )}
            </div>
            {!profile.username && <UserUpgrade />}
          </>
        )}
        {!profile && !account.isPending && !account.isError && (
          <p className="text-sm text-muted-foreground">
            Profile details are unavailable.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
