import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border-strong)] bg-white/[0.04] text-[var(--muted-foreground)]",
        accent:
          "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]",
        plain: "border-transparent bg-transparent text-[var(--muted-foreground)] px-0",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  style,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} style={style} {...props} />
  );
}

export { Badge, badgeVariants };
