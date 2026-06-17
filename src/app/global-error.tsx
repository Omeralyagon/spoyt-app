"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0F1115",
          color: "#F8F8F8",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>
          Something went wrong
        </h2>
        <p style={{ color: "#9aa0aa", maxWidth: 420, fontSize: "0.9rem" }}>
          {error?.message || "Unexpected error"}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            background: "#9AE66E",
            color: "#0F1115",
            border: "none",
            borderRadius: 999,
            padding: "0.6rem 1.5rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
