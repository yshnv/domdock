import { ArcHeader } from "@/components/arc-header";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ArcHeader />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <SignUpForm />
        </div>
      </main>
    </div>
  );
}

