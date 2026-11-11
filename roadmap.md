# CITAE visual redesign

- [x] Apply CITAE identity and shared visual system.
- [x] Present administrative views with neutral unavailable-data states.
- [x] Present the public booking experience without changing booking logic.
- [x] Verify navigation and mobile layout; preserve all Supabase and authentication files.

## Phase 2: public business settings
- [x] Read public configuration through the existing browser RPC and show business identity, currency and deposit.
- [x] Keep payment details exclusive to the payment stage without adding booking or upload operations.
- [x] Run tests and verify live settings, error and missing states on desktop and mobile.

## Complete system using existing Supabase
- [ ] Send automatic WhatsApp confirmation on deposit approval with reservation date, time, services and actual paid amount. Blocked: user declined WhatsApp Business connection; approved template, durable delivery storage and deployed callback receiver are also required before activation.
- [x] Fix payment-proof registration rejected by existing RPC permissions; explain client confirmation delivery.
- [x] Connect administrative sign-in and owner-authorized data access.
- [x] Enable services, clients, settings, working hours and blocked times editing.
- [x] Connect reservation lists, calendar, notes, cancellation and payment review.
- [x] Complete public availability, booking creation, payment proof and status retrieval.
- [x] Run 13 tests and desktop/mobile checks with real services and availability.
- [ ] Verify authenticated administrative changes and payment review end-to-end: external Supabase has no available managed test session.
- [ ] Verify live reservation creation and proof upload end-to-end: needs legitimate booking details and a real proof; no invented production records created.