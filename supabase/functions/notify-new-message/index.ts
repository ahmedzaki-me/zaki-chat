import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
const ONESIGNAL_API_KEY = Deno.env.get("ONESIGNAL_API_KEY")!;
const THRESHOLD_SECONDS = 20;

interface WebhookPayload {
  record: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
  };
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const { record: message } = payload;

  // ١. جيب المحادثة عشان تعرف مين الطرف التاني
  const { data: conversation } = await supabase
    .from("conversations")
    .select("user_id")
    .eq("id", message.conversation_id)
    .single();

  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  // ٢. الـ recipient هو الطرف التاني (مش اللي بعت)
  const recipientId =
    message.sender_id === conversation.user_id
      ? "7c694be3-f175-4ff0-bcd5-e573ddb716a3"
      :  conversation.user_id;

  // ٣. جيب الـ last_seen بتاع الـ recipient
  const { data: presence } = await supabase
    .from("user_presence")
    .select("last_seen")
    .eq("user_id", recipientId)
    .single();

  // لو مفيش سجل خالص → اليوزر ما فتحش التطبيق قبل كده → ابعت إشعار
  if (!presence) {
    await sendPushNotification(recipientId, message.sender_id, message.id);
    return new Response("Notified (no presence record)", { status: 200 });
  }

  // ٤. قارن وقت الرسالة بالـ last_seen
  const lastSeenMs = new Date(presence.last_seen).getTime();
  const messageSentMs = new Date(message.created_at).getTime();
  const diffSeconds = (messageSentMs - lastSeenMs) / 1000;

  if (diffSeconds > THRESHOLD_SECONDS) {
    await sendPushNotification(recipientId, message.sender_id, message.id);
    return new Response(`Notified (diff: ${diffSeconds}s)`, { status: 200 });
  }

  return new Response(`Skipped (diff: ${diffSeconds}s)`, { status: 200 });
});

async function sendPushNotification(userId: string, senderId: string, messageId: string) {
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", senderId)
    .single();

  if (!senderProfile) return;

  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Basic ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [userId],
      web_push_topic: messageId,

      headings: { en: `New Message` },
      contents: { en: `From ${senderProfile.full_name}` },
      url: `https://chat.ahmedzaki.me`,
    }),
  });
}

//   // ١. جيب الـ OneSignal player_id من جدول profiles
//   const { data: profile } = await supabase
//     .from("profiles")
//     .select("full_name")
//     .eq("id", userId)
//     .single();


//   if (!profile) return;

//   await fetch("https://onesignal.com/api/v1/notifications", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json; charset=utf-8",
//       Authorization: `Basic ${ONESIGNAL_API_KEY}`,
//     },
//     body: JSON.stringify({
//       app_id: ONESIGNAL_APP_ID,
//       include_external_user_ids: [userId],
//       headings: { en: `New Message`},
//       contents: { en: `from ${profile?.full_name}` },
//         url: `https://chat.ahmedzaki.me`,
//     //     chrome_web_icon: "https://qpxgafmzblnjcztkwenf.supabase.co/storage/v1/object/public/avatars/icons/Zaki-Dashboard-Logo2.png",
//     //     firefox_icon: "https://qpxgafmzblnjcztkwenf.supabase.co/storage/v1/object/public/avatars/icons/Zaki-Dashboard-Logo2.png",
//     //     small_icon: "https://qpxgafmzblnjcztkwenf.supabase.co/storage/v1/object/public/avatars/icons/Zaki-Dashboard-Logo2.png",
//     }),
//   });
// } 