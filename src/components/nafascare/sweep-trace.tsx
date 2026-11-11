import { useEffect, useRef } from "react";

import type { RunStatus } from "@/hooks/use-nafas-simulation";

export interface TraceSource {
  next(dt: number): number;
}

interface SweepTraceProps {
  source: TraceSource;
  status: RunStatus;
  windowS: number;
  min: number;
  max: number;
  colorVar: string;
  grid?: boolean | undefined;
  label: string;
}

/**
 * Monitor-style sweeping trace. Samples are pulled from `source` only while
 * running; the canvas is redrawn every animation frame. Remount to clear.
 */
export function SweepTrace({ source, status, windowS, min, max, colorVar, grid = false, label }: SweepTraceProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef(status);
  const sourceRef = useRef(source);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

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
      trace: color(colorVar),
    };

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

    const toY = (v: number) => {
      const c = Math.max(min, Math.min(max, v));
      return height * 0.08 + (1 - (c - min) / (max - min)) * height * 0.84;
    };

    const drawGrid = () => {
      const pxPerSec = width / windowS;
      const rows = 8;
      const rowH = height / rows;
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      for (let s = 1; s < windowS; s++) {
        if (s % 4 === 0) continue;
        const x = Math.round(s * pxPerSec) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let i = 1; i < rows * 2; i += 2) {
        const y = Math.round((i * rowH) / 2) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
      ctx.strokeStyle = colors.major;
      ctx.beginPath();
      for (let s = 4; s < windowS; s += 4) {
        const x = Math.round(s * pxPerSec) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let i = 1; i < rows; i++) {
        const y = Math.round(i * rowH) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      if (grid) drawGrid();

      const gap = Math.max(14, Math.round(width * 0.025));
      ctx.strokeStyle = colors.trace;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let pen = false;
      for (let x = 0; x < width; x++) {
        const v = buffer[x] ?? Number.NaN;
        if ((x - cursor + width) % width < gap || Number.isNaN(v)) {
          pen = false;
          continue;
        }
        const y = toY(v);
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
        ctx.arc(lead, toY(lv), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (statusRef.current === "running") {
        const pxPerSec = width / windowS;
        const step = 1 / pxPerSec;
        acc += dt * pxPerSec;
        while (acc >= 1) {
          buffer[cursor] = sourceRef.current.next(step);
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
  }, [colorVar, grid, max, min, windowS]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block" aria-label={label} role="img" />
    </div>
  );
}
