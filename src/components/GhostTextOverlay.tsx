import * as React from "react";

export type GhostTextOverlayProps = {
  text: string;
  fontFamily?: string;
};

export const GhostTextOverlay = ({
  text,
  fontFamily,
}: GhostTextOverlayProps): JSX.Element | null => {
  if (!text) return null;
  return (
    <div
      style={{
        marginTop: 6,
        padding: "8px 12px",
        background: "#f7f7f8",
        border: "1px dashed #cbd5e1",
        borderRadius: 6,
        color: "#475569",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        ...(fontFamily && { fontFamily }),
      }}
      data-testid="indic-compose-ghost"
    >
      <span style={{ flex: 1, opacity: 0.85, whiteSpace: "pre-wrap" }}>{text}</span>
      <kbd
        style={{
          fontSize: 11,
          padding: "2px 6px",
          border: "1px solid #cbd5e1",
          borderRadius: 4,
          background: "#fff",
          color: "#64748b",
        }}
      >
        Tab to accept
      </kbd>
    </div>
  );
};
