export default function manifest() {
  return {
    name: "EmGlodAi",
    short_name: "EmGlodAi",
    description:
      "One box. Every tool. Chat, research, images, videos, math, websites and more.",

    start_url: "/",
    scope: "/",
    display: "standalone",

    background_color: "#0D0D1A",
    theme_color: "#7B61FF",

    orientation: "portrait",

    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}