import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { UsersStatusContext } from "./UsersStatusContext";

import type { UsersStatusMap, PresenceUser } from "./UsersStatusContext";

// export function UsersStatusProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [usersStatus, setUsersStatus] = useState<UsersStatusMap>({});

//   // useEffect(() => {
//   //   const adminChannel = supabase.channel("online_users");

//   //   const updateStatus = (
//   //     state: ReturnType<typeof adminChannel.presenceState>,
//   //   ) => {
//   //     const formattedStatus: UsersStatusMap = {};
//   //     Object.values(state).forEach((presences) => {
//   //       if (!presences?.length) return;
//   //       const latest = (presences as unknown as PresenceUser[]).reduce(
//   //         (a, b) => (new Date(a.online_at) > new Date(b.online_at) ? a : b),
//   //       );

//   //       if (latest?.user_id) formattedStatus[latest.user_id] = latest;
//   //     });
//   //     setUsersStatus(formattedStatus);
//   //   };

//   //   adminChannel
//   //     .on("presence", { event: "sync" }, () => {
//   //       const state = adminChannel.presenceState();
//   //       // console.log("SYNC state:", JSON.stringify(state));
//   //       updateStatus(state);
//   //     })
//   //     .on("presence", { event: "join" }, ({ newPresences }) => {
//   //       // console.log("JOIN event:", JSON.stringify(newPresences));

//   //       setUsersStatus((prev) => {
//   //         const updated = { ...prev };
//   //         newPresences.forEach((p) => {
//   //           const user = p as unknown as PresenceUser;
//   //           if (user?.user_id) updated[user.user_id] = user;
//   //         });
//   //         return updated;
//   //       });
//   //     })
//   //     .on("presence", { event: "leave" }, ({ leftPresences }) => {
//   //       setUsersStatus((prev) => {
//   //         const updated = { ...prev };
//   //         leftPresences.forEach((p) => {
//   //           const user = p as unknown as PresenceUser;
//   //           if (user?.user_id) {
//   //             // مش delete — بس غيّر الـ status
//   //             updated[user.user_id] = { ...user, status: "offline" };
//   //           }
//   //         });
//   //         return updated;
//   //       });
//   //     })
//   //     .subscribe();

//   //   return () => {
//   //     adminChannel.unsubscribe();
//   //   };
//   // }, []);

//   // useEffect(() => {
//   //   const adminChannel = supabase.channel("online_users");
//   //   const syncUsers = () => {
//   //     const state = adminChannel.presenceState();
//   //     const formattedStatus: UsersStatusMap = {};

//   //     Object.keys(state).forEach((userId) => {
//   //       const presences = state[userId] as unknown as PresenceUser[];
//   //       const latest = presences.reduce((a, b) =>
//   //         new Date(a.online_at) > new Date(b.online_at) ? a : b,
//   //       );

//   //       formattedStatus[userId] = latest;
//   //     });

//   //     setUsersStatus(formattedStatus);
//   //   };

//   //   adminChannel
//   //     .on("presence", { event: "sync" }, syncUsers) // السيرفر يخبرنا بالحالة الكاملة
//   //     .on("presence", { event: "join" }, syncUsers) // يفضل إعادة المزامنة عند دخول أحد
//   //     .on("presence", { event: "leave" }, syncUsers) // يفضل إعادة المزامنة عند خروج أحد
//   //     .subscribe();

//   //   return () => {
//   //     adminChannel.unsubscribe();
//   //   };
//   // }, []);

//   useEffect(() => {
//     const adminChannel = supabase.channel("online_users");

//     // ✅ single source of truth — بيشتغل بعد كل join/leave/reconnect
//     const syncFromState = () => {
//       const state = adminChannel.presenceState();
//       const formattedStatus: UsersStatusMap = {};

//       Object.values(state).forEach((presences) => {
//         if (!presences?.length) return;
//         // لو نفس اليوزر عنده أكتر من تاب، خد أحدث واحد
//         const latest = (presences as unknown as PresenceUser[]).reduce(
//           (a, b) => (new Date(a.online_at) > new Date(b.online_at) ? a : b),
//         );
//         if (latest?.user_id) formattedStatus[latest.user_id] = latest;
//       });

//       setUsersStatus(formattedStatus);
//     };

//     adminChannel.on("presence", { event: "sync" }, syncFromState).subscribe();

//     return () => {
//       supabase.removeChannel(adminChannel);
//     };
//   }, []);

//   return (
//     <UsersStatusContext.Provider value={{ usersStatus }}>
//       {children}
//     </UsersStatusContext.Provider>
//   );
// }

export function UsersStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usersStatus, setUsersStatus] = useState<UsersStatusMap>({});

  // ✅ ref للمقارنة — بنتجنب re-render لو الداتا معتملتش فعلاً
  const prevStatusRef = useRef<UsersStatusMap>({});
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const OFFLINE_THRESHOLD_MS = 20_000; // أكبر من الـ heartbeat بهامش أمان
  const SYNC_DEBOUNCE_MS = 500;

  useEffect(() => {
    const adminChannel = supabase.channel("online_users");
    const now = () => Date.now();

    const buildMap = (): UsersStatusMap => {
      const state = adminChannel.presenceState();
      const formattedStatus: UsersStatusMap = {};

      Object.values(state).forEach((presences) => {
        if (!presences?.length) return;

        const latest = (presences as unknown as PresenceUser[]).reduce(
          (a, b) => (new Date(a.online_at) > new Date(b.online_at) ? a : b),
        );

        if (!latest?.user_id) return;

        const isStale =
          now() - new Date(latest.online_at).getTime() > OFFLINE_THRESHOLD_MS;
        formattedStatus[latest.user_id] = {
          ...latest,
          status: isStale ? "offline" : latest.status,
        };
      });

      return formattedStatus;
    };

    // ✅ مقارنة عشان نتجنب re-render لو مفيش تغيير حقيقي
    const hasChanged = (next: UsersStatusMap): boolean => {
      const prev = prevStatusRef.current;
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);

      if (prevKeys.length !== nextKeys.length) return true;

      return nextKeys.some(
        (id) =>
          prev[id]?.status !== next[id]?.status ||
          prev[id]?.online_at !== next[id]?.online_at,
      );
    };

    const applyUpdate = (next: UsersStatusMap) => {
      if (!hasChanged(next)) return; // ✅ مفيش تغيير = مفيش re-render
      prevStatusRef.current = next;
      setUsersStatus(next);
    };

    // ✅ debounce: لو جم 5 sync events في 500ms → run مرة واحدة بس
    const debouncedSync = () => {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        applyUpdate(buildMap());
      }, SYNC_DEBOUNCE_MS);
    };

    adminChannel.on("presence", { event: "sync" }, debouncedSync).subscribe();

    // ✅ stale check كل دقيقة بدل 20 ثانية
    const staleTimer = setInterval(() => {
      applyUpdate(buildMap());
    }, 60_000);

    return () => {
      clearTimeout(syncTimerRef.current);
      clearInterval(staleTimer);
      supabase.removeChannel(adminChannel);
    };
  }, []);

  return (
    <UsersStatusContext.Provider value={{ usersStatus }}>
      {children}
    </UsersStatusContext.Provider>
  );
}
