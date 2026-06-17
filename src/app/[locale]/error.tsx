"use client";

import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mascot.png" alt="" className="mb-5 h-20 w-20 opacity-80" />
      <h2 className="font-display text-3xl">Something went wrong</h2>
      <p className="mt-3 max-w-md break-words text-sm text-muted-foreground">
        {error?.message || "Unexpected error"}
        {error?.digest ? ` (ref: ${error.digest})` : ""}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
