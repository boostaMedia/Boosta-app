import SwiftUI

/// Boosta Preview — a thin native shell that renders the Boosta web app inside
/// a WKWebView so it can be previewed on the iOS Simulator.
@main
struct BoostaPreviewApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
