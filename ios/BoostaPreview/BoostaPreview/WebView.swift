import SwiftUI
import WebKit

/// A SwiftUI wrapper around `WKWebView`.
///
/// Reloads when `url` changes, or when `reloadToken` is incremented, and
/// reports loading / error state back to the host view.
struct WebView: UIViewRepresentable {
    let url: URL
    let reloadToken: Int
    let onLoadingChange: (Bool) -> Void
    let onError: (Bool) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        context.coordinator.lastToken = reloadToken
        context.coordinator.lastURL = url
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        let coordinator = context.coordinator
        if coordinator.lastURL != url {
            coordinator.lastURL = url
            coordinator.lastToken = reloadToken
            webView.load(URLRequest(url: url))
        } else if coordinator.lastToken != reloadToken {
            coordinator.lastToken = reloadToken
            webView.reload()
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let parent: WebView
        var lastToken = 0
        var lastURL: URL?

        init(_ parent: WebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.onLoadingChange(true)
            parent.onError(false)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.onLoadingChange(false)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.onLoadingChange(false)
            parent.onError(true)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.onLoadingChange(false)
            parent.onError(true)
        }
    }
}
