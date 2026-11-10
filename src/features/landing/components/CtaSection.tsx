import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import { Button } from "@/shared/components/ui/button";
import { LANDING_COPY } from "@/features/landing/constants/landing.constants";
import { ArrowUpRight } from "lucide-react";

export function CtaSection() {
  const shouldReduceMotion = useReducedMotion();

  const handleScrollToGuest = () => {
    const formEl = document.getElementById("guest-form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const input =
          (document.getElementById("your-name") as HTMLInputElement | null) ||
          formEl.querySelector("input");
        input?.focus();
      }, 400);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-b from-primary/10 via-primary/5 to-transparent p-8 text-center sm:p-12"
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
          {LANDING_COPY.cta.headline}
        </h2>

        <p className="text-sm text-muted-foreground sm:text-base text-balance leading-relaxed">
          {LANDING_COPY.cta.subheadline}
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            onClick={handleScrollToGuest}
            className="text-white/90"
          >
            {LANDING_COPY.cta.buttonText}
          </Button>

          <Button variant="outline" asChild>
            <Link to="/auth/signup" className="flex items-center gap-1.5">
              <span>{LANDING_COPY.cta.signUpText}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
