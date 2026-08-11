"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    if (window.confirm("Are you sure you want to log out of DomDock?")) {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    }
  };

  return <Button onClick={logout}>Logout</Button>;
}
