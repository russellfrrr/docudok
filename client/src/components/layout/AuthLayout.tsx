import type { ReactNode } from 'react';
import { FileText, MessageSquareText, Search } from 'lucide-react';
import { AppLogo } from './AppLogo';
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
    <main className="grid min-h-screen bg-muted lg:grid-cols-[minmax(420px,0.85fr)_1.15fr]">
      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-8">
          <AppLogo />

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {children}
        </div>
      </section>

      <section className="hidden border-l bg-card lg:block">
        <div className="relative flex h-full min-h-screen items-center justify-center overflow-hidden p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.08),transparent_32%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.06),transparent_30%)]" />

          <div className="relative w-full max-w-2xl">
            <div className="mb-6 flex items-center">
              <motion.div
                className="relative flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground"
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
            </div>

            <div className="relative overflow-hidden rounded-lg border bg-background shadow-sm">
              <motion.div
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-primary/10 to-transparent"
                animate={{
                  y: ['-100%', '430%'],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div className="border-b px-5 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    uploaded-contract.pdf
                  </span>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <div className="rounded-md border bg-muted/60 p-4">
                  <div className="mb-3 h-2 w-24 rounded bg-muted-foreground/30" />
                  <div className="space-y-2">
                    <div className="h-2 rounded bg-muted-foreground/20" />
                    <div className="h-2 w-11/12 rounded bg-muted-foreground/20" />
                    <div className="h-2 w-9/12 rounded bg-muted-foreground/20" />
                  </div>
                </div>

                <motion.div
                  className="ml-auto max-w-[78%] rounded-md border bg-card p-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MessageSquareText className="size-3.5" />
                    AI Answer
                  </div>
                  <p className="text-sm leading-6 text-foreground">
                    The document indicates a renewal clause, payment terms, and
                    two sections that require review before signing.
                  </p>
                </motion.div>

                <div className="grid gap-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Sources
                  </div>
                  <motion.div
                    className="rounded-md border bg-card p-3 text-xs leading-5 text-muted-foreground"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                  >
                    Section 4.2 - Renewal continues unless either party gives
                    written notice 30 days before expiration.
                  </motion.div>
                  <motion.div
                    className="rounded-md border bg-card p-3 text-xs leading-5 text-muted-foreground"
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

            <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="rounded-md border bg-background p-3">
                Extract text
              </div>
              <div className="rounded-md border bg-background p-3">
                Find sources
              </div>
              <div className="rounded-md border bg-background p-3">
                Answer safely
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
