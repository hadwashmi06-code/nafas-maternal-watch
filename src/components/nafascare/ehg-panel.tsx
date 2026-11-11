import { Waves } from "lucide-react";
import { useEffect, useRef } from "react";

import type { RunStatus } from "@/hooks/use-nafas-simulation";
import { EhgSynth, type EhgParams } from "@/lib/nafascare/ehg";
import type { Scenario, SensorReading } from "@/lib/nafascare/scenarios";
import { cn } from "@/lib/utils";

const WINDOW_S = 24;
const RANGE = 1.2; // ± units shown vertically (1 unit = 1 mV-sim)
const ROWS = 8;

function EhgCanvas({ status, params, sessionId }: { status: RunStatus; params: EhgParams; sessionId: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef(status);
  const paramsRef = useRef(params);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrap || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const color = (name: string) => css.getPropertyValue(name).trim();
    const colors = {
      bg: color("--panel-inset"),
      grid: color("--monitor-grid"),
      major: color("--monitor-grid-major"),
      trace: color("--signal-ehg"),
    };

    const synth = new EhgSynth(paramsRef.current);
    let width = 1;
    let height = 1;
    let dpr = 1;
    let buffer = new Float32Array(1).fill(Number.NaN);
    let cursor = 0;
    let acc = 0;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = Math.max(1, Math.floor(r.width));
      height = Math.max(1, Math.floor(r.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const next = new Float32Array(width).fill(Number.NaN);
      next.set(buffer.subarray(0, Math.min(buffer.length, width)));
      buffer = next;
      cursor = Math.min(cursor, width - 1);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      const pxPerSec = width / WINDOW_S;
      const rowH = height / ROWS;

      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      for (let s = 1; s < WINDOW_S; s++) {
        if (s % 4 === 0) continue;
        const x = Math.round(s * pxPerSec) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let i = 1; i < ROWS * 2; i++) {
        if (i % 2 === 0) continue;
        const y = Math.round((i * rowH) / 2) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      ctx.strokeStyle = colors.major;
      ctx.beginPath();
      for (let s = 4; s < WINDOW_S; s += 4) {
        const x = Math.round(s * pxPerSec) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let i = 1; i < ROWS; i++) {
        const y = Math.round(i * rowH) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      const mid = height / 2;
      const scale = mid / RANGE;
      const gap = Math.max(14, Math.round(width * 0.025));
      ctx.strokeStyle = colors.trace;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let pen = false;
      for (let x = 0; x < width; x++) {
        const v = buffer[x] ?? Number.NaN;
        const inGap = (x - cursor + width) % width < gap;
        if (inGap || Number.isNaN(v)) {
          pen = false;
          continue;
        }
        const y = mid - Math.max(-RANGE, Math.min(RANGE, v)) * scale;
        if (pen) ctx.lineTo(x, y);
        else {
          ctx.moveTo(x, y);
          pen = true;
        }
      }
      ctx.stroke();

      const lead = (cursor - 1 + width) % width;
      const lv = buffer[lead] ?? Number.NaN;
      if (!Number.isNaN(lv)) {
        ctx.fillStyle = colors.trace;
        ctx.beginPath();
        ctx.arc(lead, mid - Math.max(-RANGE, Math.min(RANGE, lv)) * scale, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      synth.setTarget(paramsRef.current);
      if (statusRef.current === "running") {
        const pxPerSec = width / WINDOW_S;
        const step = 1 / pxPerSec;
        acc += dt * pxPerSec;
        while (acc >= 1) {
          buffer[cursor] = synth.next(step);
          cursor = (cursor + 1) % width;
          acc -= 1;
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [sessionId]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block" aria-label="Simulated EHG waveform" role="img" />
    </div>
  );
}

interface EhgPanelProps {
  status: RunStatus;
  scenario: Scenario;
  sensor: SensorReading;
  sessionId: number;
  className?: string;
}

export function EhgPanel({ status, scenario, sensor, sessionId, className }: EhgPanelProps) {
  const p = scenario.ehg;
  const readouts = [
    { label: "Burst interval (sim)", value: `${p.period} s` },
    { label: "Peak amplitude (sim)", value: `${(p.amplitude * 0.9).toFixed(2)} mV` },
    { label: "Pattern (sim)", value: scenario.ehgPattern },
    {
      label: "Signal quality",
      value: sensor.note.split(" · ")[0],
      tone: sensor.state === "connected" ? "text-status-ok" : "text-status-review",
    },
  ];

  return (
    <section className={cn("flex min-h-0 flex-col rounded-md border border-border bg-card", className)}>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2.5">
          <Waves className="size-4 text-signal-ehg" aria-hidden />
          <h2 className="text-sm font-semibold text-signal-ehg">Simulated EHG</h2>
          <span className="text-xs text-muted-foreground">Uterine electrical activity · Ch 1–2 bipolar</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <span className="rounded-sm border border-border px-1.5 py-px">{WINDOW_S} s window</span>
          <span className="rounded-sm border border-border px-1.5 py-px">0.3 mV/div</span>
          <span className="rounded-sm border border-border px-1.5 py-px">Time-compressed</span>
        </div>
      </header>

      <div className="relative m-2 min-h-[180px] flex-1 overflow-hidden rounded-sm border border-border">
        <EhgCanvas status={status} params={p} sessionId={sessionId} />
        <span className="pointer-events-none absolute left-2 top-1.5 font-mono text-[10px] text-signal-ehg">EHG · SIM</span>
        {status === "paused" && (
          <span className="pointer-events-none absolute right-2 top-1.5 rounded-sm border border-status-review/60 bg-background/80 px-1.5 py-px font-mono text-[10px] font-semibold text-status-review">
            PAUSED
          </span>
        )}
        {status === "standby" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Standby</span>
            <span className="text-xs text-muted-foreground">Press Play Demo to start the simulated stream</span>
          </div>
        )}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 border-t border-border px-3 py-2 md:grid-cols-4">
        {readouts.map((r) => (
          <div key={r.label}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.label}</div>
            <div className={cn("text-xs font-medium tabular-nums", r.tone)}>{r.value}</div>
          </div>
        ))}
      </div>
      <p className="shrink-0 border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        Synthetic research-concept signal. EHG is not a direct measure of blood loss and is not a clinically validated
        diagnostic method for postpartum haemorrhage.
      </p>
    </section>
  );
}
