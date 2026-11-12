import { BatteryMedium, Bluetooth, Cable } from "lucide-react";

import type { PatchStatus, RunStatus } from "@/hooks/use-nafas-simulation";
import { PATCH_ID } from "@/lib/nafascare/patient";
import {
  EXTERNAL_DEVICE_IDS,
  SENSOR_INFO,
  type SensorId,
  type SensorReading,
} from "@/lib/nafascare/scenarios";
import { cn } from "@/lib/utils";

import { Panel } from "./panel";

const DOT = {
  connected: "bg-status-ok",
  degraded: "bg-status-review",
  disconnected: "bg-status-urgent",
} as const;

const qualityTone = (q: number) =>
  q >= 75 ? "bg-status-ok" : q >= 50 ? "bg-status-review" : "bg-status-urgent";
const rssiBars = (rssi: number) => (rssi >= -60 ? 4 : rssi >= -67 ? 3 : rssi >= -75 ? 2 : 1);
const rssiLabel = (rssi: number) => (rssi >= -60 ? "Strong" : rssi >= -67 ? "Good" : "Weak");

interface Props {
  status: RunStatus;
  patch: PatchStatus;
  sensors: Record<SensorId, SensorReading>;
  className?: string | undefined;
}

export function DevicePanel({ status, patch, sensors, className }: Props) {
  const ehg = sensors.ehg;
  const stream =
    status === "running" ? "Streaming" : status === "paused" ? "Paused" : "Paired · standby";
  const bars = rssiBars(patch.rssi);

  return (
    <Panel
      aria-label="Patch and device connectivity"
      title="Patch & devices"
      className={className}
      bodyClassName="flex flex-col text-[11px]"
    >
      <div className="space-y-1.5 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", DOT[ehg.state])} aria-hidden />
          <span className="font-semibold">{SENSOR_INFO.ehg.label}</span>
          <span
            className={cn(
              "ml-auto text-[10px] font-medium",
              status === "running" ? "text-status-ok" : "text-muted-foreground",
            )}
          >
            {stream}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span className="shrink-0 font-mono">{PATCH_ID}</span>
          <span className={cn("truncate", ehg.state !== "connected" && "text-status-review")}>
            {ehg.note}
          </span>
        </div>

        <div aria-label="Electrode signal quality" className="grid grid-cols-4 gap-1.5">
          {patch.electrodes.map((q, i) => (
            <div key={i} title={`Electrode E${i + 1}: ${q}%`}>
              <div className="flex items-baseline justify-between font-mono text-[9px] text-muted-foreground">
                <span>E{i + 1}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    q < 50 && "text-status-urgent",
                    q >= 50 && q < 75 && "text-status-review",
                  )}
                >
                  {q}%
                </span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", qualityTone(q))}
                  style={{ width: `${q}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center gap-1.5 rounded-sm border border-border px-1.5 py-1">
            <Bluetooth className="size-3.5 shrink-0 text-signal-spo2" aria-hidden />
            <span className="flex h-3 items-end gap-px" aria-hidden>
              {[1, 2, 3, 4].map((b) => (
                <span
                  key={b}
                  className={cn("w-[3px] rounded-[1px]", b <= bars ? "bg-foreground" : "bg-muted")}
                  style={{ height: `${b * 25}%` }}
                />
              ))}
            </span>
            <span className="truncate" title={`${patch.rssi} dBm`}>
              {rssiLabel(patch.rssi)}{" "}
              <span className="font-mono text-[9px] text-muted-foreground">{patch.rssi} dBm</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-sm border border-border px-1.5 py-1">
            <BatteryMedium
              className={cn(
                "size-3.5 shrink-0",
                patch.battery < 20 ? "text-status-review" : "text-status-ok",
              )}
              aria-hidden
            />
            <span className="font-mono tabular-nums">{patch.battery}%</span>
            <span className="truncate text-[9px] text-muted-foreground">battery</span>
          </div>
        </div>
        <p className="text-[10px] leading-snug text-muted-foreground">
          Patch records uterine electrical activity only.
        </p>
      </div>

      <div className="px-3 py-2">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Cable className="size-3" aria-hidden />
          External devices
        </div>
        <ul className="space-y-1">
          {EXTERNAL_DEVICE_IDS.map((id) => {
            const s = sensors[id];
            return (
              <li key={id} className="flex items-center gap-2" title={s.note}>
                <span className={cn("size-1.5 shrink-0 rounded-full", DOT[s.state])} aria-hidden />
                <span className="min-w-0 truncate">
                  {SENSOR_INFO[id].label}
                  {s.state !== "connected" && (
                    <span className="text-status-review"> · {s.note}</span>
                  )}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                  {SENSOR_INFO[id].provides}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}
