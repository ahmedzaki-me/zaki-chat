import {
  Zap,
  Mic,
  Smile,
  CheckCheck,
  Bell,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
}

export const LANDING_COPY = {
  hero: {
    headline: "Hey, I'm Ahmed. Send me a message.",
    tagline:
      "This is a direct line to me. I read every message, and you don't need an account to say hi.",
    nameLabel: "What should I call you?",
    namePlaceholder: "Your name or nickname",
    submitButton: "Continue as Guest",
  },
  features: [
    {
      icon: Zap,
      title: "Real-time messaging",
      description:
        "Sub-second delivery powered by dedicated WebSocket connections.",
    },
    {
      icon: Mic,
      title: "Photos, videos & voice notes",
      description:
        "Record audio with interactive waveforms and share media seamlessly.",
    },
    {
      icon: Smile,
      title: "Reactions & replies",
      description:
        "Express yourself with emoji reactions and jump straight to quoted replies.",
    },
    {
      icon: CheckCheck,
      title: "Read receipts & typing",
      description:
        "Live sent, delivered, and read status markers, plus instant typing indicators.",
    },
    {
      icon: Bell,
      title: "Push notifications",
      description:
        "Stay in the loop with instant web push alerts even when the tab is closed.",
    },
    {
      icon: Smartphone,
      title: "Installable PWA & offline cache",
      description:
        "Install as a native-like app on mobile or desktop, with instant offline chat history.",
    },
  ] as FeatureItem[],
  steps: [
    {
      number: "01",
      title: "Enter your name or sign up",
      description:
        "Hop in instantly as a guest with just your display name, or create a permanent account.",
    },
    {
      number: "02",
      title: "Say hi to Zaki",
      description:
        "Start a private 1-on-1 thread. Drop questions, feedback, or project collaboration ideas.",
    },
    {
      number: "03",
      title: "Get notified when he replies",
      description:
        "Receive push notifications or come back anytime to pick up right where you left off.",
    },
  ] as StepItem[],
  cta: {
    headline: "Ready to start a conversation?",
    subheadline:
      "No lengthy sign-up needed. Join in seconds as a guest or create an account.",
    buttonText: "Start chatting as guest",
    signUpText: "Or create a permanent account",
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Zaki Chat. Engineered by Ahmed Zaki.`,
  },
};
