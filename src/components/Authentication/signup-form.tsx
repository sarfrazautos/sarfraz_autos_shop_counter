"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { loginAdminAction } from "@/app/actions/auth-actions";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid administrator email address.",
  }),
  password: z.string().min(6, {
    message: "Admin password must be at least 6 characters.",
  }),
});

export const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await loginAdminAction({
        email: values.email,
        password: values.password,
      });

      if (!result.success) {
        const errorMsg = result.error || "Invalid administrator credentials.";
        setAuthError(errorMsg);
        toast.add({
          title: "Access Denied",
          description: errorMsg,
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      toast.add({
        title: "Welcome Back, Shahmeer!",
        description: "Credentials verified. Loading shop counter terminal...",
        type: "success",
      });

      // Check redirect param if any
      const searchParams = new URLSearchParams(window.location.search);
      const destination = searchParams.get("redirect") || "/dashboard";

      window.location.href = destination;
    } catch {
      setAuthError("Network connection error. Please verify your connection.");
      toast.add({
        title: "Connection Error",
        description: "Unable to reach authentication server. Please try again.",
        type: "error",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {authError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2 animate-in fade-in">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <div className="space-y-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-xs font-semibold">Admin Email</FieldLabel>
              <div className="relative">
                <Input
                  aria-invalid={fieldState.invalid}
                  placeholder="name@example.com"
                  type="email"
                  disabled={isLoading}
                  autoComplete="email"
                  className="h-10 text-xs bg-background pl-9"
                  {...field}
                />
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel className="text-xs font-semibold">Admin Password</FieldLabel>
              </div>
              <div className="relative">
                <Input
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter administrator password"
                  type={showPassword ? "text" : "password"}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-10 text-xs bg-background pl-9 pr-9"
                  {...field}
                />
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 text-xs font-bold gap-2 cursor-pointer transition-all active:scale-98 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Verifying Credentials...</span>
          </>
        ) : (
          <>
            <span>Log In to Shop Terminal</span>
            <ArrowRight className="size-4 ml-auto" />
          </>
        )}
      </Button>
    </form>
  );
};
