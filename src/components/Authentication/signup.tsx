import Image from "next/image";
import { SignUpForm } from "@/components/Authentication/signup-form";

const SignUp = () => (
  <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-background">
    <div className="w-full max-w-md px-8 py-10 sm:px-10 sm:py-12 rounded-2xl border bg-card shadow-lg sm:shadow-2xl/5">
      <Image
        src="/logo.png"
        alt="Shop Counter Logo"
        width={64}
        height={64}
        className="mx-auto h-14 w-auto object-contain"
        priority
      />
      <h1 className="mt-4 text-center font-bold text-2xl tracking-[-0.015em]">
        Shop Counter Admin Portal
      </h1>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">
        Log in to your shop account to manage products, inventory & counter sales
      </p>

      <div className="mt-8">
        <SignUpForm />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Single access portal for shop administration &bull; Authorized personnel only
      </p>
    </div>
  </div>
);

export default SignUp;
