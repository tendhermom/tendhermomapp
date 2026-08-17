# Testing Round Fixes — 13 Issues

Grouped by area. Each item lists what happens now (verified in code) and what changes.

## Community

**Post photo — Post button unreachable (issue 2)**
The create-post sheet already lifts above the keyboard, but on short screens the Post button can still scroll out of view once a photo preview is added. Change: pin the Post button as a fixed footer inside the sheet so it is always visible, with the text/photo area scrolling above it.

**Comment send button clipped on the right (issue 3)**
The comment input row has no right-side safe padding, so the round send button sits flush to the screen edge and gets cut. Change: give the input row proper horizontal padding and a fixed-size send button that cannot be squeezed.

**Deleting own post is not instant (issue 9)**
Deletion already removes the post from the local list, but the comment-level delete and the post-card delete paths do not both refresh. Change: make every delete path (post and comment) remove the item from the visible list immediately, then confirm with the server in the background.

**Exclusive badge + tappable profile photo (issue 12)**
The post card shows only a name and a small avatar. Change: fetch each author's Plus status alongside their name/avatar, show a small "Plus" badge next to the name, and make the avatar tappable to open a full-size viewer.

## Baby Shower

**Gift option missing (issue 7)**
The card only offers Congrats/Love when the viewer is the post owner, and the Gift option is otherwise present. Reported as missing in production, so the picker will be reworked: Gift always renders for non-owners (never hidden for any other reason), and tapping it opens the mum's bank details sheet with the "I've Gifted" confirmation. This will be verified in the running preview after the change.

**Month locking is too strict (issue 8)**
Right now only the exact current month can be opened; every other month shows a "locked" toast. Change:
- All past months in the current calendar year are open (viewing, reacting, gifting).
- December of the previous year stays open.
- Only future months are locked.
- Posting a new baby stays limited to the current month.

**Photos are cropped and single-only (issue 11)**
Change: store multiple photos per baby post (up to 5), show the first as the cover with a count indicator, and open a swipeable full-image viewer on tap so nothing is cropped.

## Emergency Contacts

**Cannot pick from the phone's contacts (issue 1)**
The import path only runs when the app detects the Despia native shell via user-agent. If that detection fails inside the WebView, mums fall straight through to the manual form — which matches the report. Change: stop gating on user-agent detection; always attempt the native contacts read first, fall back to the browser contact picker, and only then to manual entry, with a clear message about which path was used.

**Channel display (issue 13)**
Change: keep SMS ("Text") active and green; render WhatsApp and Voice Call greyed out and non-interactive with a "Coming soon" note, instead of removing them.

## Safety Net

**Toggle kicks the user out (issue 5)**
Toggling refreshes the whole profile from the server, which replaces the signed-in user object and bounces the screen. Change: update the toggle state locally and patch just that one field in the store, without a full profile reload, so the user stays on the Safety Net screen.

## Refer a Friend

**Invite doesn't appear until you leave and return (issue 6)**
The list is only refreshed after the SMS step succeeds; if the SMS call errors, the refresh never runs even though the referral row was saved. Change: add the new referral to the list immediately after it's saved, then send the SMS separately and report SMS problems without hiding the saved invite.

## Back Button

**No exit confirmation (issue 4)**
Currently one back press at a root tab silently disarms, and the second press leaves the app. Change: on a root tab, the first back press shows a small "Leave TendherMom?" confirmation sheet with Cancel / Exit; Exit closes the app. Inside a sub-screen, back still returns one step with no prompt.

## Rescue Map

**Hospitals no longer load (issue 10)**
The screen calls the health-hubs backend function and shows "Couldn't load nearby health centers" whenever that call fails. This is almost certainly the Google Maps API key/billing state rather than app code — that was flagged previously and is still outstanding. Step 1 is to read the function's live logs to confirm the exact Google error, then either fix the request (key/params) on our side or report precisely what needs enabling on your Google Cloud billing account. Improved error text will distinguish "no results nearby" from "maps service unavailable".

## Technical notes

- Baby Shower multi-photo needs a schema change: add an `image_urls` text array to `baby_shower_posts`, backfill from the existing `image_url`, and keep `image_url` as the cover for older clients.
- Community Plus badge needs the public profile lookup to also return plan/tester status; this will be added to the existing `get_public_profiles` function so no extra query per post is required.
- Contacts: remove the `isDespiaNative()` precondition inside `readDespiaContacts` and treat a non-response as "unsupported" with a timeout instead.
- Back-exit confirmation lives in the existing single-sentinel history handler; the sentinel is re-seeded when the user cancels.
- Safety Net: replace the `fetchProfile` call with a targeted store field update.
