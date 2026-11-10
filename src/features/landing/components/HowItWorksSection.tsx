import { motion, useReducedMotion } from "motion/react";
import { LANDING_COPY } from "@/features/landing/constants/landing.constants";

export function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-8 sm:gap-10"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Workflow
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          How it works
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base text-balance">
          Start a private conversation in three effortless steps.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {LANDING_COPY.steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{
              duration: 0.4,
              delay: shouldReduceMotion ? 0 : index * 0.1,
              ease: "easeOut",
            }}
            className="relative flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-6"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
              {step.number}
            </span>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
