# PRE manual QA — v1.15.4

Environment: `https://pre.smashandlob.com`  
Use the owner account and a second test account. Do not use a real production account for destructive checks.

## Access and QR spectator

1. Open a league spectator QR/link in a private window with no session.
2. Choose **Acceder sin iniciar sesión**.
3. Confirm the public league view loads, including Home, ranking, calendar and results.
4. Confirm `/spectate/<code>/view` does not return 404.
5. Confirm settings expose only the reduced spectator options.

## Notifications

1. Open **Notificaciones** and note the unread count.
2. Open one notification and confirm it becomes visually read.
3. Reload the page and confirm the state persists.
4. Use **Marcar todas como leídas** and confirm the count reaches zero.
5. Open a chat and confirm its own unread counter is unchanged by notification actions.
6. Repeat the check from a second signed-in device/browser.

## Account data

1. In **Ajustes → Mis datos**, download the JSON export.
2. Confirm the file contains only the signed-in account's profile, memberships, own season rows, own personal matches, notification preferences and push subscriptions.
3. Do not run account deletion on a real account. In a disposable test account, verify that the confirmation text is required and that cancellation leaves the account unchanged.

## Personal matches and language

1. Switch the app to Spanish, English and Euskera.
2. Visit `Mis partidos`, its detail, new match, profile and chats.
3. Confirm titles, empty states, buttons, errors, placeholders and accessible labels change language without Spanish-only visible copy.

## Welcome Pack and QR UI

1. Open Welcome Pack on mobile width and desktop width.
2. Check the compact panels, sticker selector, colour mode, repetition and A4 orientation labels.
3. Generate the sticker PDF and verify the selected designs, repeated copies, logo fillers and exterior bleed.
4. Open the league QR popup and verify download and share use the PRE league URL.

## Core regression smoke

1. Open Home, Mis ligas, Calendario, Ranking, Partido and Ajustes.
2. Confirm the back arrow and refresh controls keep their intended destinations.
3. Confirm an active league in player-experience mode still exposes **Crear nueva liga** when the account is authorised.
4. Confirm scheduled/secret seasons do not expose premature match or custodian notifications.

Report the exact environment, account type, URL, browser/device and reproduction steps for any failure. Do not paste tokens or personal data.
