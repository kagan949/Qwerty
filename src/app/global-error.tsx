"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#09090b", color: "#f6f6f8", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <p style={{ fontSize: 40, margin: 0, fontWeight: 800 }}>VYBE</p>
            <p style={{ color: "#a3a3b6", fontSize: 14, marginTop: 8 }}>
              Something went wrong. Reload the app to continue — your music stays on this device.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 20,
                background: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: 999,
                padding: "10px 20px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Reload VYBE
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
