import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { NafasDashboard } from "@/components/nafascare/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NafasCare — Postpartum Monitoring Simulation" },
      {
        name: "description",
        content:
          "Interactive prototype of a postpartum maternal monitoring dashboard with simulated EHG, vital signs and review prompts. Simulation only — not for clinical use.",
      },
      { property: "og:title", content: "NafasCare — Postpartum Monitoring Simulation" },
      {
        property: "og:description",
        content: "Clinical monitoring dashboard prototype with fictional data and demonstration scenarios. Not for clinical use.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // The monitor uses live clocks, random signal noise and canvas — render it on the client only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Initialising monitor…</span>
      </div>
    );
  }
  return <NafasDashboard />;
}
