<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- NafasCare dashboard is client-only simulation: all state lives in `src/hooks/use-nafas-simulation.ts` (pure reducer, randomness passed in via actions) — keeps behaviour deterministic and testable with no backend.
- Scenario values live in `src/lib/nafascare/scenarios.ts` and review-prompt thresholds in `src/lib/nafascare/review-rules.ts` (covered by `src/test/review-rules.test.ts`) — one source of truth for every displayed value and prompt.
- Dashboard layout targets iPad landscape: from the `lg` breakpoint everything fits one viewport (no page scroll), and the expandable Additional monitoring panel shrinks before the EHG/vitals do; below `lg` it stacks and scrolls — keeps the core monitor always visible on a tablet.
- Monitor traces (EHG, ECG, pleth) use the shared canvas `SweepTrace` driven by requestAnimationFrame and synth classes in `src/lib/nafascare/`, decoupled from the 1 s vitals tick; the trace group is keyed by sessionId so Reset clears it — keeps traces smooth without per-frame React renders.
