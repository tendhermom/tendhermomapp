# Stress-test fixes: password reset, community photos, renewal date

## 1. Forgot password page looks scattered
What's known: the email link opens the "New password" page directly. The cause of the broken layout hasn't been confirmed yet.
- Open the reset link at phone and iPad sizes (Safari and Chrome engines), take screenshots, and find what breaks: missing fonts or styles, the startup screen overlapping it, or the page losing its session.
- Fix the layout so it matches the Sign-in page: centred card, logo, two password fields, one green button, no blank space or overlap.
- Make the link work even when the email opens in a browser outside the app. If the link has expired, show a clear "Link expired, send a new one" message instead of a broken page.
- Restyle the reset email so it has a proper "Reset password" button instead of a plain "CLICK HERE" link.

## 2. Community: only the admin can post photos
Checked so far: the storage and posting rules allow every signed-in user to upload, and the server logs show no rejected uploads. So the photo never leaves non-admin phones, which points to a problem inside the app.
- Reproduce with a normal (non-admin) test account on a phone-sized screen, both with and without Plus.
- Likely causes to check: the photo picker inside the native app wrapper, iPhone HEIC photos, large camera photos, and a silent stop when the session check fails.
- Fix whatever the test shows. Every failure will show a clear message instead of doing nothing, and HEIC and large photos will be converted to JPEG before upload.

## 3. "Next recurring debit" date is 2 days off
This is our bug, so you don't need to contact Paystack. Paystack charges on the correct date. Our app adds 2 extra days of grace access, in case a renewal payment fails, and then shows that grace date as the "next debit" date. That's why Paystack charges on the 10th while the app says the 12th.
- Save Paystack's actual next charge date separately and show that date as "Next debit".
- Keep the 2-day grace period running in the background so nobody loses access while a renewal is processing. It just won't be shown as the debit date anymore.
- Correct the dates for existing subscribers from Paystack's records.

## Technical details
- Payments: add `paystack_next_payment_at` to profiles. Set it from `next_payment_date` in paystack-webhook, paystack-verify and paystack-manage (the status call refreshes it from Paystack's subscription API). paystack-manage returns `next_payment_at`, and PremiumScreen uses it for the renewal label, falling back to plus_expires_at minus the grace period. Redeploy all 3 functions. Add a unit test checking that the displayed date equals Paystack's next_payment_date.
- Community: CreatePostModal / imageCompression. Set `accept="image/*"` without `capture`, convert HEIC to JPEG, derive the file extension from the MIME type, and surface errors from the getUser/session check. Verify the full flow end to end as a non-admin user.
- Reset: ResetPassword / App boot shield. Make sure the boot splash and version gate never cover `/reset-password`, handle `error=` hash params, and scaffold the branded auth email template for recovery.
