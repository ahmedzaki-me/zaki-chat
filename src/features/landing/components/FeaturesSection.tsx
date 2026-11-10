import { motion, useReducedMotion } from "motion/react";
import { LANDING_COPY } from "@/features/landing/constants/landing.constants";

export function FeaturesSection() {
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
          Features
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          What you get
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base text-balance">
          Everything you expect from a modern messaging platform, built directly into the web.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
        {LANDING_COPY.features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                duration: 0.4,
                delay: shouldReduceMotion ? 0 : index * 0.05,
                ease: "easeOut",
              }}
              className="group flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40 hover:shadow-xs"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
