# Meal Planner — share & install

**Live app:** https://andrewmcconnell1-crypto.github.io/weekly-planner-react/

## Paste-to-a-friend note

> Here's the meal planner I've been using — plan the week's dinners and it
> builds your shopping list: https://andrewmcconnell1-crypto.github.io/weekly-planner-react/
>
> You can tap **"Explore without an account"** to have a look around with sample
> data, or **sign in** (Google is easiest) to start your own — it syncs across
> your phone and laptop.
>
> Tip: add it to your home screen so it opens like a real app:
> - **iPhone:** open the link in Safari → tap the Share button → **Add to Home
>   Screen**.
> - **Android:** open in Chrome → menu (⋮) → **Install app** / **Add to Home
>   screen**.

## Once installed

It runs full-screen with its own icon and works offline (handy in-store —
your list is cached on the device).

## For the owner (you)

Sign-in and cross-device sync only work if the Supabase keys are set on the
deploy: repo **Settings → Secrets and variables → Actions → Variables** →
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. If they're unset, the app
still works but in local-only mode (no accounts, data stays on each device).

Notes:
- Email sign-up / magic links use Supabase's built-in mailer, which is heavily
  rate-limited. For more than a couple of people, set up custom SMTP in the
  Supabase dashboard, or point friends at Google sign-in.
- Google sign-in needs the Google provider enabled in Supabase, with the live
  URL added as an allowed redirect.
