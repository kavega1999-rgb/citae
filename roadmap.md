# CITAE visual redesign

## Professional scheduling
- [x] Make professional weekly hours authoritative, with business hours as fallback for professionals without their own schedule.
- [x] Add business/professional closures by hours or whole dates, hidden from public availability.
- [x] Enable safe appointment rescheduling without changing services or payments.
- [x] Run scheduling tests and public desktop/mobile checks; preview builds successfully.
- [ ] Verify closures and appointment moves in the authenticated live UI: external Supabase has no available managed session.

## Multi-business CITAE
- [x] Generate the client link automatically from the business name during business creation, with an optional manual override and a short-link warning; 9 focused tests pass, full suite 47 pass, preview build OK.
- [x] Enable business-owner registration, separate business configuration and shareable booking links; support a business agenda and a solo professional while preserving pilot records and securing tenant isolation. 30 tests pass; two-business database tests ran with rolled-back fixtures; real pilot catalog and availability checked on desktop/mobile.
- [ ] Verify complete signup/onboarding, copying a business link and authenticated payment approval through the live UI: external Supabase has no managed test session; email signup settings remain unverified.

- [x] Refresh all screens with Sora/Manrope, a cleaner CITAE palette, clearer hierarchy and mobile-friendly controls; preserve connected operations. All 25 tests pass; desktop/mobile layouts and navigation checked without overflow or runtime errors. Authenticated admin views remain unavailable for live inspection.

- [x] Apply CITAE identity and shared visual system.
- [x] Present administrative views with neutral unavailable-data states.
- [x] Present the public booking experience without changing booking logic.
- [x] Verify navigation and mobile layout; preserve all Supabase and authentication files.

## Phase 2: public business settings
- [x] Read public configuration through the existing browser RPC and show business identity, currency and deposit.
- [x] Keep payment details exclusive to the payment stage without adding booking or upload operations.
- [x] Run tests and verify live settings, error and missing states on desktop and mobile.

## Complete system using existing Supabase
- [x] Allow editing each WhatsApp confirmation before opening WhatsApp, with restoration of the original reservation message; eight focused tests pass and preview build OK. Live authenticated flow remains unverified without an external Supabase session.
- [x] Add direct WhatsApp confirmation buttons in Pagos and Reservas, enabled after approval, with real booking details and approved-payment totals; no WhatsApp Business API. All 23 tests pass; preview build OK. Arrival instructions omitted because no existing field provides them; authenticated button flow awaits available external Supabase session.
- [x] Fix payment-proof registration rejected by existing RPC permissions; explain client confirmation delivery.
- [x] Connect administrative sign-in and owner-authorized data access.
- [x] Enable services, clients, settings, working hours and blocked times editing.
- [x] Connect reservation lists, calendar, notes, cancellation and payment review.
- [x] Complete public availability, booking creation, payment proof and status retrieval.
- [x] Run 13 tests and desktop/mobile checks with real services and availability.
- [ ] Verify authenticated administrative changes and payment review end-to-end: external Supabase has no available managed test session.
- [ ] Verify live reservation creation and proof upload end-to-end: needs legitimate booking details and a real proof; no invented production records created.