import type { ReactNode } from 'react';
import { CheckCircle2, FileText, MessageSquareText, Search } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { ThemeToggle } from './ThemeToggle';
import { motion } from 'motion/react';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const AuthLayout = ({
  title,
  description,
  children,
}: AuthLayoutProps) => {
  return (
    <main className="relative grid min-h-screen bg-muted lg:grid-cols-[minmax(380px,0.72fr)_1.28fr] xl:grid-cols-[minmax(430px,0.65fr)_1.35fr]">
      <div className="fixed right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <section className="flex items-center justify-center px-5 py-16 sm:px-8 lg:py-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-10">
            <AppLogo />

            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                Document workspace
              </div>
              <h1 className="text-[2.1rem] font-semibold leading-[1.06] tracking-tight text-foreground sm:text-[2.45rem]">
                {title}
              </h1>
              <p className="max-w-sm text-[0.95rem] leading-7 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          {children}

          <div className="grid gap-3 text-[0.86rem] leading-6 text-muted-foreground">
            {[
              'Source-backed answers',
              'Secure document workspace',
              'Fast PDF review',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hidden border-l bg-card lg:block">
        <div className="relative flex h-full min-h-screen items-center justify-center overflow-hidden px-10 py-14 xl:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(14,165,233,0.13),transparent_30%),radial-gradient(circle_at_78%_72%,rgba(255,255,255,0.08),transparent_28%)] dark:bg-[radial-gradient(circle_at_28%_18%,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_78%_72%,rgba(255,255,255,0.05),transparent_28%)]" />

          <div className="relative w-full max-w-3xl">
            <div className="mb-8 max-w-2xl space-y-3">
              <div className="flex items-center gap-3">
                <motion.div
                  className="relative flex size-10 items-center justify-center rounded-md border border-sky-500/20 bg-background text-sky-700 shadow-sm dark:text-sky-300"
                  animate={{
                    opacity: [0.75, 1, 0.75],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <motion.span
                    className="absolute inset-0 rounded-md border border-primary/20"
                    animate={{
                      scale: [1, 1.28, 1],
                      opacity: [0, 0.5, 0],
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <Search className="relative size-4" />
                </motion.div>
                <div className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
                  Document preview
                </div>
              </div>
              <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground xl:text-5xl">
                Ask questions about any document
              </h2>
              <p className="max-w-xl text-[0.95rem] leading-7 text-muted-foreground">
                Upload PDFs, contracts, reports, and manuals. Get
                source-backed answers in seconds.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-border/80 bg-background shadow-2xl shadow-black/5 dark:shadow-black/30">
              <motion.div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-transparent via-sky-400/20 to-transparent"
                animate={{
                  y: ['-100%', '430%'],
                  opacity: [0, 1, 0.8, 0],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-px bg-sky-400/60 shadow-[0_0_24px_rgba(56,189,248,0.65)]"
                animate={{
                  x: [0, 760, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 5.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div className="border-b bg-card/40 px-6 py-5">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-sky-700 dark:text-sky-300" />
                  <span className="text-sm font-medium text-foreground">
                    uploaded-contract.pdf
                  </span>
                </div>
              </div>

              <div className="grid gap-5 p-6">
                <div className="rounded-lg border bg-muted/50 p-5">
                  <div className="mb-3 h-2 w-24 rounded bg-muted-foreground/30" />
                  <div className="space-y-2">
                    <div className="h-2 rounded bg-muted-foreground/20" />
                    <div className="h-2 w-11/12 rounded bg-muted-foreground/20" />
                    <div className="h-2 w-9/12 rounded bg-muted-foreground/20" />
                  </div>
                </div>

                <motion.div
                  className="ml-auto max-w-[82%] rounded-xl border border-sky-500/20 bg-card p-5 shadow-lg shadow-sky-950/5 ring-1 ring-sky-500/10 dark:shadow-black/20"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  <div className="mb-3 flex items-center gap-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                    <MessageSquareText className="size-3.5" />
                    Answer
                  </div>
                  <p className="text-[0.93rem] leading-7 text-foreground">
                    The document indicates a renewal clause, payment terms, and
                    two sections that require review before signing.
                  </p>
                </motion.div>

                <div className="grid gap-2">
                  <div className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Sources
                  </div>
                  <motion.div
                    className="cursor-pointer rounded-lg border bg-card p-4 text-[0.78rem] leading-6 text-muted-foreground transition hover:border-sky-500/30 hover:bg-muted/40"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                  >
                    Section 4.2 - Renewal continues unless either party gives
                    written notice 30 days before expiration.
                  </motion.div>
                  <motion.div
                    className="cursor-pointer rounded-lg border bg-card p-4 text-[0.78rem] leading-6 text-muted-foreground transition hover:border-sky-500/30 hover:bg-muted/40"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 }}
                  >
                    Section 7.1 - Payment is due within 15 business days after
                    invoice receipt.
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <div className="rounded-lg border bg-background/70 p-3">
                Extract text
              </div>
              <div className="rounded-lg border bg-background/70 p-3">
                Find sources
              </div>
              <div className="rounded-lg border bg-background/70 p-3">
                Review clearly
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
