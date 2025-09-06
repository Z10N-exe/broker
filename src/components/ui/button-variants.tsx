import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-[var(--transition-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Trading Platform Specific Variants
        hero: "bg-gradient-primary text-white shadow-primary hover:shadow-glow hover:scale-105 border-0",
        trading: "bg-card border border-primary/20 text-foreground hover:bg-primary/10 hover:border-primary/40",
        success: "bg-gradient-success text-white hover:bg-success/90",
        danger: "bg-gradient-danger text-white hover:bg-destructive/90",
        buy: "bg-success text-success-foreground hover:bg-success/90",
        sell: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        glow: "bg-primary text-primary-foreground hover:shadow-glow hover:bg-primary-glow animate-pulse-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);