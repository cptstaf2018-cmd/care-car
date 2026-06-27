# Care Car Mobile Store Checklist

## Current Mobile Wrapper

- Runtime: Capacitor
- App name: Care Car
- App ID / bundle ID: `online.carecar.app`
- Web build folder: `frontend/dist`
- Android project: `frontend/android`
- iOS project: `frontend/ios`

## Public Policy URLs

- Privacy Policy: `https://carecar.online/privacy`
- Terms: `https://carecar.online/terms`
- Support: `https://carecar.online/support`
- Account deletion: `https://carecar.online/account-deletion`

## Permissions

- Internet: required to sync SaaS data.
- Camera: optional, used for vehicle plate scanning and receipt scanning when the center chooses camera features.
- Location: not used.
- Microphone: not used.

## Google Play Data Safety Draft

Data collected or processed:

- Account info: center name, manager email or WhatsApp number.
- Personal info entered by centers: customer names and phone numbers.
- App activity/business records: cars, services, invoices, debts, inventory.
- Photos/images: camera frames for plate/receipt recognition when the feature is used.

Disclosure:

- Data is used to provide app functionality, account management, messaging, and service records.
- Data is not sold.
- Account deletion is available inside the app and at `/account-deletion`.

## Apple App Privacy Draft

Data linked to user/company:

- Contact info: email, phone number.
- User content/business records: cars, invoices, services, inventory, debts.
- Diagnostics/app activity: login/session and operational logs.

Camera:

- Optional permission.
- Purpose: scan vehicle plates and purchase receipts.

## Build Commands

From `frontend`:

```bash
npm run build
npx cap sync
npx cap open android
npx cap open ios
```

Android release AAB is built from Android Studio or Gradle inside `frontend/android`.
iOS archive requires Xcode on macOS and an Apple Developer account.
