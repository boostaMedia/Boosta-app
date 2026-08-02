import SwiftUI

struct ContentView: View {
    /// The preview target. On the Simulator, `localhost` resolves to the Mac,
    /// so the running Next.js dev server (`npm run dev`) is reachable directly.
    @AppStorage("boosta_preview_url") private var urlString = "http://localhost:3000"

    @State private var isLoading = false
    @State private var didFail = false
    @State private var reloadToken = 0
    @State private var showSettings = false

    private var url: URL {
        URL(string: urlString) ?? URL(string: "http://localhost:3000")!
    }

    var body: some View {
        ZStack {
            WebView(
                url: url,
                reloadToken: reloadToken,
                onLoadingChange: { isLoading = $0 },
                onError: { didFail = $0 }
            )
            .ignoresSafeArea(edges: .bottom)

            if isLoading && !didFail {
                ProgressView()
                    .controlSize(.large)
            }

            if didFail {
                errorView
            }
        }
        .overlay(alignment: .topTrailing) {
            Button {
                showSettings = true
            } label: {
                Image(systemName: "gearshape")
                    .padding(10)
                    .background(.ultraThinMaterial, in: Circle())
            }
            .padding()
        }
        .sheet(isPresented: $showSettings) {
            settingsView
        }
    }

    private var errorView: some View {
        VStack(spacing: 12) {
            Image(systemName: "wifi.exclamationmark")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("Couldn't load Boosta")
                .font(.headline)
            Text(urlString)
                .font(.footnote)
                .foregroundStyle(.secondary)
            Text("Make sure the Boosta dev server is running (npm run dev) and the URL is reachable from the Simulator.")
                .font(.footnote)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            Button("Retry") {
                didFail = false
                reloadToken += 1
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }

    private var settingsView: some View {
        NavigationStack {
            Form {
                Section("Preview URL") {
                    TextField("http://localhost:3000", text: $urlString)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                }
                Section {
                    Button("Reload") {
                        didFail = false
                        reloadToken += 1
                        showSettings = false
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { showSettings = false }
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
