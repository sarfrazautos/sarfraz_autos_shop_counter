"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
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
import { Separator } from "@/components/ui/separator";
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
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "admin@sarfrazautos-counter.com",
      password: "",
    },
  });

  const performLogin = async (email: string, password: string) => {
    try {
      const result = await loginAdminAction({ email, password });

      if (!result.success) {
        toast.add({
          title: "Access Denied",
          description: result.error || "The email or password you entered is incorrect.",
          type: "error",
        });
        setIsLoading(false);
        setIsQuickLoggingIn(false);
        return;
      }

      toast.add({
        title: "Welcome Back, Shahmeer!",
        description: "Admin verified successfully. Loading shop counter terminal...",
        type: "success",
      });

      // Navigate to dashboard
      window.location.href = "/dashboard";
    } catch {
      toast.add({
        title: "Connection Notice",
        description: "Unable to complete authentication request. Please check your network and try again.",
        type: "warning",
      });
      setIsLoading(false);
      setIsQuickLoggingIn(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await performLogin(values.email, values.password);
  }

  const handleQuickAdminLogin = async () => {
    setIsQuickLoggingIn(true);
    setIsLoading(true);
    form.setValue("email", "admin@sarfrazautos-counter.com");
    form.setValue("password", "111shahmeer111");

    toast.add({
      title: "One-Click Admin Sign-in",
      description: "Authenticating with pre-configured administrator credentials...",
      type: "info",
    });

    await performLogin("admin@sarfrazautos-counter.com", "111shahmeer111");
  };

  const isBusy = isLoading || isQuickLoggingIn;

  return (
    <div className="space-y-6">
      {/* Quick Admin Access Button */}
      <Button
        className="w-full h-11 bg-primary text-primary-foreground font-semibold gap-2 cursor-pointer shadow-sm hover:opacity-95 active:scale-98 transition-all"
        size="lg"
        type="button"
        disabled={isBusy}
        onClick={handleQuickAdminLogin}
      >
        {isQuickLoggingIn ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Authenticating Admin...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="size-4 text-emerald-300" />
            <span>One-Click Admin Sign-In</span>
            <Sparkles className="size-3.5 ml-auto opacity-70" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-3 overflow-hidden">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
          or sign in manually
        </span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    placeholder="admin@sarfrazautos-counter.com"
                    type="email"
                    disabled={isBusy}
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
                    disabled={isBusy}
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
          disabled={isBusy}
          variant="outline"
          className="w-full h-11 text-xs font-bold gap-2 cursor-pointer transition-all active:scale-98 mt-2"
        >
          {isLoading && !isQuickLoggingIn ? (
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
    </div>
  );
};
