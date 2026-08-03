import type { MetadataRoute } from "next";

/** PWA web app manifest — makes the webapp installable on iOS/Android/desktop. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boosta Media",
    short_name: "Boosta",
    description:
      "Boosta — the media & marketing services marketplace for Kuwait & the GCC.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#2e6bb0",
    dir: "auto",
    orientation: "portrait",
    categories: ["business", "productivity", "shopping"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
