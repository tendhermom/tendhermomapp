# Final pre-launch fixes (8 items)

## 1. Baby Shower caption
Change "Celebrate babies born each month" to "Also celebrate babies born on each month" (and align the wording in the info card below the grid).

## 2. Full-screen photo viewer
Tapping a baby photo opens a full-screen viewer: uncropped image, swipe/arrow between the up-to-4 photos, dot indicators, tap-outside or X to close, safe-area aware. Same viewer style already used for community photos.

## 3. Multi-line chat inputs
AI Chat and the community comment/post inputs grow from 1 line to up to 3 lines as the user types, then scroll internally. Send button stays aligned and un-clipped; the keyboard lift behaviour is kept.

## 4. Dedicated Gift button on baby cards
Each baby card gets a visible "Gift" button beside the React button (visitors only, not the owner). It opens the existing bank-details sheet with the mum's account name, number, bank, copy button and "I've Gifted" confirmation. The Gift option stays in the reaction picker as well.

## 5. Subscription message on web
Replace the red error "Subscriptions are only available in the TendherMom mobile app" with a calm, informational note ("Open TendherMom on your phone to subscribe or restore purchases") on the paywall, upgrade and restore actions. No behaviour change inside the native app.

## 6. Terms of Use
Add "Rescue Map" to the premium features listed in section 4 (Premium Subscriptions), alongside Inactivity Alert, Unlimited AI and Gift Button.

## 7. Profile picture viewer
Tapping your own avatar on the Profile screen opens the same full-screen image viewer, so it can be seen clearly.

## 8. Support contact details
Remove the phone number and tel: call action from Help & Support (and anywhere else it appears). Contacts become:
- WhatsApp: `Whatsapp.com/@tendhermom`
- Email: `support@tendhermom.com`

## Technical notes
- Files touched: `src/screens/BabyShowerScreen.tsx`, `src/components/cards/BabyShowerCard.tsx`, `src/screens/AIChatScreen.tsx`, `src/components/community/CommentsSheet.tsx`, `src/components/community/CreatePostModal.tsx`, `src/components/PaywallDrawer.tsx`, `src/lib/revenuecat.ts`, `src/pages/Terms.tsx`, `src/screens/ProfileScreen.tsx`, `src/screens/HelpSupportScreen.tsx`.
- A small shared `PhotoViewer` component is added so Baby Shower and Profile use one implementation.
- No database, edge function or billing-logic changes; RevenueCat purchase flow inside the native app is untouched.
