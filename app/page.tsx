"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">(
    "checking"
  );

  useEffect(() => {
    async function checkConnection() {
      const { error } = await supabase.auth.getSession();
      setStatus(error ? "error" : "connected");
    }
    checkConnection();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="font-display text-2xl">Learn Ge&apos;ez</h1>
      <p className="font-mono text-sm text-ink/70">
        {status === "checking" && "Checking Supabase connection..."}
        {status === "connected" && "Supabase connected. Ready to build."}
        {status === "error" &&
          "Supabase connection failed — check your .env.local values."}
      </p>
      <Link
        href="/learn/script"
        className="rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90"
      >
        Start with the Fidel <span className="font-ethiopic">ሀ ለ ሐ</span>
      </Link>
    </main>
  );
}
