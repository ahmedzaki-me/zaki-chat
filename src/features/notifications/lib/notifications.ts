export async function closeConversationNotifications(conversationId: string) {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const notifications = await registration?.getNotifications({ tag: `conv:${conversationId}` });
    notifications?.forEach((notification) => notification.close());
  } catch { /* Notification cleanup is best effort. */ }
}
