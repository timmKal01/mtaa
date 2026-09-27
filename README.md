# Mtaa

Hyperlocal errands for Nairobi. Customers post something to deliver, pick up, buy, run or move;
nearby providers take the job once it's paid and update it until it's delivered.

- **Customer:** post a job (what, from, to, day, time slot, budget in KES), pay (M-Pesa **test stub**),
  follow it through posted → accepted → picked up → delivered.
- **Provider:** browse paid jobs, accept, mark picked up, mark delivered. You can't accept your own job
  or a job that hasn't been paid.

Payments are simulated (`PATCH /jobs/:id/pay` returns a `STUB-…` receipt). Live M-Pesa comes later.

## Run it

Requires the API in `../mtaa-api` (NestJS + Prisma + Neon) running on port 3000.

1. `mtaa/.env`:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   EXPO_PUBLIC_API_URL=http://<your PC's LAN IP>:3000
   ```
   Use the PC's IP on the Wi-Fi/hotspot the phone is on (never `localhost`, never Metro's `8081`).
2. `npm install`
3. `npx expo start -c` and open in Expo Go. Use `-c` whenever `.env` changes; `EXPO_PUBLIC_*`
   values are baked into the bundle.

Settings → Connection shows which server the app is using and whether it can reach it.

## Layout

- `src/app/` — tabs: Home (`index`), Jobs (`explore`), Search, Settings. Profile and notifications
  open as panels from the Home header.
- `src/context/jobs.tsx` — one shared copy of the jobs list for every screen.
- `src/lib/api.ts` — the only place that knows `EXPO_PUBLIC_API_URL`.
- `src/lib/jobs.ts` — job types, labels, time slots, notifications derived from job history.
