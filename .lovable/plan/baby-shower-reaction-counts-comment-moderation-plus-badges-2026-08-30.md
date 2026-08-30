# Baby Shower reaction counts + comment moderation & Plus badges

## 1. Reaction counter always shows "No reactions yet"

Confirmed cause: the stored `reactions_count` on every baby shower post is `0`, while the actual reactions exist (e.g. Baby Zion has 2 real reactions, stored count 0). Nothing keeps that column in sync — the app only nudges the number in local memory, so it resets to zero on every refresh. That's why the card says "No reactions yet" but the "Celebrated by" sheet shows everyone.

Fix:
- Add a database trigger on the reactions table that increments/decrements the post's `reactions_count` on insert and delete (type changes don't alter the count).
- Backfill all existing posts with their true reaction totals so counts are correct immediately.
- Keep the card's optimistic update, but refresh the real count after a reaction so the number always matches.

## 2. Comments: post owner can moderate

Currently only the comment author can delete a comment (database rule allows delete only when it is your own).

Fix:
- Add a database rule so the owner of the community post can also delete any comment on her own post.
- In the comments sheet, show the delete action when the viewer is the comment author OR the owner of the post. Wording stays as-is for own comments; for others' comments on your post the confirmation reads "Remove this comment from your post?".
- Everyone else continues to see the delete action only on their own comments.

## 3. Plus badge beside names

The Plus status is already available for post authors; comments don't display it yet.

Fix:
- Carry the Plus flag through to each comment author.
- Show the same small Plus badge beside the commenter's name in the comments sheet, matching the badge already used on posts (same size, colour and spacing).

## Technical notes
- Migration: `AFTER INSERT/DELETE` trigger function on `public.reactions` updating `public.baby_shower_posts.reactions_count`; one-off `UPDATE ... = (select count(*) ...)` backfill; new DELETE policy on `public.post_comments` allowing `auth.uid()` matching the parent `community_posts.user_id` (via a `SECURITY DEFINER` helper to avoid cross-table policy recursion).
- Files: `src/screens/BabyShowerScreen.tsx` (refetch count after reaction), `src/stores/communityStore.ts` (`author_is_plus` on `PostComment`, post-owner delete), `src/components/community/CommentsSheet.tsx` (badge + owner-moderation delete), `src/screens/CommunityScreen.tsx` (pass post owner id).
- No changes to gifting, payments, or the baby shower posting flow.
