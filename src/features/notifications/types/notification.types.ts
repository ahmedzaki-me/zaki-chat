import type { paths } from "@/shared/types/api.generated";
export type { PushPayload } from "@/features/notifications/lib/payload";

export type PushConfig =
  paths["/push/config"]["get"]["responses"]["200"]["content"]["application/json"];

export type PushSubscriptionData =
  paths["/push/subscriptions"]["post"]["requestBody"]["content"]["application/json"];
