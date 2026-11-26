# SRM Mobile Portal (Android Kotlin WebView)

A lightweight, pure Kotlin Android app that loads the official **SRMIST Student Portal** (`https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp`) directly on your phone and applies a local mobile-responsive CSS/JS layer—keeping the familiar SRM UI while making layouts, forms, and wide tables comfortable on mobile screens.

## Features
- **Direct Official Origin:** Connects directly to `sp.srmist.edu.in` (no proxy server; login, CAPTCHA, and credentials stay 100% native and secure).
- **Mobile-Responsive Injection:** Automatically injects `assets/mobile/srm_mobile.css` and `assets/mobile/srm_mobile.js` on SRM pages to fix overflow, clamp wide elements, improve touch targets, and wrap wide academic/fee tables in smooth horizontal scroll containers (including AJAX-loaded tabs via `MutationObserver`).
- **Native Mobile UX:** Pull-to-refresh (only at top of page), top loading progress bar, hardware back-button navigation, offline retry screen, authenticated PDF/file downloads via Android `DownloadManager`, and file chooser upload support.

## Project Structure

```text
.
├── .github/workflows/build-apk.yml       # Cloud APK build via GitHub Actions
├── build.gradle.kts                      # Root Gradle config
├── settings.gradle.kts
├── gradle.properties
├── gradle/wrapper/gradle-wrapper.properties
└── app/
    ├── build.gradle.kts                  # App module (minSdk 24, targetSdk 35)
    ├── proguard-rules.pro
    └── src/main/
        ├── AndroidManifest.xml
        ├── assets/mobile/
        │   ├── srm_mobile.css            # Mobile-responsive CSS overrides
        │   └── srm_mobile.js             # Viewport + table scroll wrapper + MutationObserver
        ├── java/com/srm/mobileportal/
        │   ├── MainActivity.kt           # WebView lifecycle, downloads, uploads, back nav
        │   ├── PortalConfig.kt           # Portal URL & asset constants
        │   ├── PortalWebViewClient.kt    # Navigation, error handling, injection trigger
        │   └── AssetInjector.kt          # Safe Base64 CSS & JS asset injector
        └── res/
            ├── drawable/                 # Adaptive icon vectors
            ├── layout/activity_main.xml  # SwipeRefresh + WebView + Progress + Error UI
            ├── mipmap-anydpi-v26/        # Adaptive launcher icons
            └── values/                   # colors.xml, strings.xml, themes.xml
```

## How to Build the APK

### Option 1: Android Studio (Recommended)
1. Open this folder (`sandbox_web`) in **Android Studio**.
2. Wait for Gradle sync to finish.
3. Click **Build → Build Bundle(s) / APK(s) → Build APK(s)** (or click **Run** with your Android phone connected via USB debugging).
4. Find the APK at `app/build/outputs/apk/debug/app-debug.apk`.

### Option 2: GitHub Actions (No Android Studio Needed)
1. Push this folder to a GitHub repository.
2. Open the **Actions** tab → **Build Android APK** → download the `srm-mobile-portal-debug-apk` artifact and install it on your Android phone.

## Customizing Mobile Styles
To tweak how any inner portal page looks after logging in, edit:
- `app/src/main/assets/mobile/srm_mobile.css` (layout, spacing, font sizes, table styling)
- `app/src/main/assets/mobile/srm_mobile.js` (DOM adjustments for dynamic pages)
