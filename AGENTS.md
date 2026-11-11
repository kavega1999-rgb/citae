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

## Application presentation
- Keep administrative presentation in a shared UI module with thin, individually titled content routes so the product shell remains consistent.
- Keep the public booking presentation separate from the administrative shell; business identity must not replace product identity.
- Unconnected visual views show unavailable-data placeholders and never imply loaded records or perform business mutations.

## Public booking settings
- Read public business settings with the existing browser client RPC through React Query; never read the private settings table for public presentation.
- Keep payment configuration in a stage-gated presentation component; only the payment stage may render identifiers or instructions, without inventing unfinished booking steps.

## Connected operations
- Keep businesses isolated through protected user_roles memberships and business_id RLS/composite relationships; new membership creation is atomic through create_my_business, never from editable account metadata. An owner may hold several businesses; current_business_id follows profiles.active_business_id, changed only through the membership-checked set_active_business RPC.
- Resolve public booking data by the business slug through existing RPCs; retain the legacy pilot default and scope query/storage keys by business to prevent mixed catalogs or recovered appointments.
- Generate direct WhatsApp confirmations from confirmed appointments with approved deposits (or no deposit rows when the business disables deposits), using a shared browser-safe formatter and an editable per-send dialog; never treat opening WhatsApp as delivery or prefill access tokens, internal notes or payment identifiers.
- Keep admin reads and mutations in authenticated server functions, checking the tenant-aware is_admin RPC and retaining user-scoped RLS; profiles.role is not an authorization source.
- Use only create_public_appointment_v2 for public creation and get_available_slots for availability, passing the chosen professional when the business has active professionals; the RPCs remain authoritative for prices, scheduling and per-professional overlap.
- Public booking lives only at /agenda/$slug; business colors apply as CSS variables on that page and, while the owner is signed in, on the admin panel; the CITAE wordmark and name stay.
- Business logos and professional photos live in the private business-media bucket under a business-id folder, uploaded via signed URLs from owner server functions and displayed through short-lived signed URLs.
- Issue signed proof uploads only after validating the reservation token, status and deadline, and restrict paths to that reservation; the existing private bucket has no public insert policy.
- Register uploaded proofs through a token-validated server function calling the existing submit_payment_proof RPC; browser roles lack execute permission and must not gain broader grants.
- Keep reservation access tokens out of URLs and shared logs; session storage and user-requested access files retain the capability without exposing it through referrers.
