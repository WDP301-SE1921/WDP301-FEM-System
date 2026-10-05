# Design System (Mobile — React Native/Expo)

Applies to every screen/component in the mobile app. Keep it consistent with the web version (design.md); only the implementation differs to fit React Native.

## Overall Style

Friendly Professional, classic — serious and trustworthy, but still warm and approachable.

- Avoid overly childish/cartoonish styling.
- Avoid a cold, gray, corporate look.

## Colors

```js
const colors = {
  primary: '#2563EB', // or "#16A34A"
  accent: '#F59E0B',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
};
```

- Light background as the base; do not use dark mode as the default.
- Clear semantic colors for the four attendance statuses defined in the SRS: present, absent, made_up, excused.

## Typography

- Font: Be Vietnam Pro, Inter, or Plus Jakarta Sans — load via `expo-font` / `@expo-google-fonts/*`.
- Clear hierarchy: bold headings, body text with enough contrast; use tabular figures for numbers (scores, %) if available.
- Never go below 14px for primary content (readability on phones).

## Border Radius — mandatory rule across the whole app

No sharp/square corners anywhere. The larger the block, the larger the radius.

| Element                                     | borderRadius (px)                  |
| ------------------------------------------- | ---------------------------------- |
| Logo / Avatar                               | 999 (fully round) or 16            |
| Large images (hero, banner)                 | 24                                 |
| Cards (subjects, notifications, results...) | 16–20, consistent across all cards |
| Large blocks/sections                       | 24                                 |
| Input field                                 | 12                                 |
| Button                                      | 999 (pill) or 12                   |
| Icon container (icon background)            | 999 or 16                          |
| Badge / Tag                                 | 999 (pill)                         |

Rule of thumb: minimum radius 12px, never use square corners (`borderRadius: 0`) anywhere.

## Component Stack

- React Native + Expo (Expo Router)
- SafeAreaView: import from `react-native-safe-area-context`, not from `react-native`
- Styling: StyleSheet or NativeWind (Tailwind for RN) — prefer NativeWind if the web app already uses Tailwind, to keep color/spacing tokens in sync
- FlatList: always set `flex: 1` on the parent container to avoid scroll bugs
- Local storage: AsyncStorage for lightweight caching (favorites, selected filters)

## Mobile-specific UX

- Minimum touch target of 44x44px for every tappable button/icon
- Bottom tab bar for primary navigation (avoid a drawer as the main nav)
- Child switcher (if multiple children): place in the header as avatars/horizontal tabs, easy to swipe through
- Loading/empty/error states: always include a gentle illustration or icon, never a blank white screen
- Status bar: handle overlap correctly (SafeAreaView + StatusBar config) to avoid content being cut off at the top

## Target Audience

Parents. The mobile app only serves the parent role (see `docs/SRS.md`, sections 1.2 and 1.3): a parent signs in and manages one or more child profiles. There are no student accounts, so middle/junior-high school students (grades 6–9) use the app through their parent's signed-in session to receive and submit homework and to view results. Teachers and other centre staff use the web app; whether teachers also get mobile access is still open (SRS section 9).

Prioritize fast, low-step interactions and clear text that isn't cluttered on small screens.
