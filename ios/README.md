# Boosta Preview (iOS)

A thin native **SwiftUI + WKWebView** shell that renders the Boosta web app so
it can be previewed on the **iOS Simulator**. This is a preview harness, not a
native rewrite — it loads the same Next.js app that runs in the browser.

## Requirements

- Xcode 16+ with an iOS Simulator runtime installed
  (Xcode → Settings → Components, or `xcodebuild -downloadPlatform iOS`).

## Run it

1. Start the Boosta web dev server (from the repo root):

   ```bash
   npm run dev
   ```

2. Build & launch the iOS app on a simulator:

   ```bash
   cd ios/BoostaPreview
   xcodebuild -project BoostaPreview.xcodeproj -scheme BoostaPreview \
     -sdk iphonesimulator -configuration Debug \
     -destination 'platform=iOS Simulator,name=iPhone 16' build

   # then install & launch the built .app on a booted simulator
   ```

   Or just open `BoostaPreview.xcodeproj` in Xcode and press Run.

The app loads `http://localhost:3000` by default — on the Simulator,
`localhost` resolves to your Mac, so the running dev server is reachable
directly. Tap the ⚙️ button to point it at a different URL (e.g. a deployed
Boosta URL).

## Structure

```
ios/BoostaPreview/
├── BoostaPreview.xcodeproj/       # Xcode project (+ shared scheme)
└── BoostaPreview/
    ├── BoostaPreviewApp.swift     # @main App entry
    ├── ContentView.swift          # Web view host, loading/error/settings UI
    ├── WebView.swift              # WKWebView UIViewRepresentable
    └── Info.plist                 # ATS allowances for the local dev server
```

## Notes

- App Transport Security allows arbitrary/local loads **for development preview
  only** so the `http://localhost` dev server can be loaded. A production build
  would tighten this to the real HTTPS origin.
- Bundle id: `app.boosta.preview`. Display name: **Boosta**.
