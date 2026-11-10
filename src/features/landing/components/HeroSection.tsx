import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import { GuestLoginForm } from "@/features/auth/components/GuestLoginForm";
import { LANDING_COPY } from "@/features/landing/constants/landing.constants";

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative grid grid-cols-1 items-center gap-8 pt-2 pb-4 sm:gap-10 sm:pt-4 sm:pb-6 lg:grid-cols-12 lg:gap-12"
    >
      {/* Left Column: Personal message & inline guest form */}
      <div className="flex flex-col gap-6 lg:col-span-7">
        <div className="flex flex-col gap-2.5">
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-3xl lg:text-4xl text-balance">
            {LANDING_COPY.hero.headline}
          </h1>

          <p className="max-w-lg text-sm text-muted-foreground sm:text-base text-balance leading-relaxed">
            {LANDING_COPY.hero.tagline}
          </p>
        </div>

        {/* Clean inline form without card borders */}
        <div className="flex max-w-lg flex-col gap-2">
          <GuestLoginForm
            inline
            label={LANDING_COPY.hero.nameLabel}
            placeholder={LANDING_COPY.hero.namePlaceholder}
            submitLabel={LANDING_COPY.hero.submitButton}
          />

          {/* Touch-friendly text links under form (44px min tap targets) */}
          <div className="flex flex-col text-xs text-muted-foreground">
            <p className="flex flex-wrap items-center">
              <span>Already have an account?</span>
              <Link
                to="/auth/login"
                className="inline-flex min-h-[44px] items-center px-1.5 font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                Log in
              </Link>
            </p>
            <p className="flex flex-wrap items-center">
              <span>Want to keep your chats across devices?</span>
              <Link
                to="/auth/signup"
                className="inline-flex min-h-[44px] items-center px-1.5 font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Real Chat Screenshot Frame */}
      <div className="flex justify-center lg:col-span-5">
        <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[340px]">
          {/* Subtle primary glow behind screenshot */}
          <div
            aria-hidden="true"
            className="absolute -inset-1 -z-10 rounded-3xl bg-primary/10 blur-lg opacity-50"
          />

          <div className="relative max-h-[440px] overflow-hidden rounded-2xl border border-border/80 bg-card p-1 shadow-xl shadow-primary/5 sm:max-h-none sm:rounded-3xl sm:p-1.5">
            <img
              src="/Chat_Screenshot.png"
              alt="Zaki Chat messaging interface preview"
              width={464}
              height={887}
              loading="eager"
              className="h-full w-full rounded-xl object-cover object-top sm:h-auto sm:rounded-2xl"
            />

            {/* Mobile bottom fade-out gradient */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent sm:hidden"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
