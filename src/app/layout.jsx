import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  metadataBase: new URL("https://emglodai.vercel.app"),
  title: {
    default: "EmGlodAi — One box. Every tool.",
    template: "%s | EmGlodAi",
  },
  description:
    "Chat, research, generate images and video, plan your schedule, and more — all from a single command bar.",
  openGraph: {
    title: "EmGlodAi — One box. Every tool.",
    description:
      "Chat, research, generate images and video, plan your schedule, and more — all from a single command bar.",
    url: "https://emglodai.vercel.app",
    siteName: "EmGlodAi",
    images: [{ url: "/logo.png", width: 1254, height: 1254 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EmGlodAi — One box. Every tool.",
    description:
      "Chat, research, generate images and video, plan your schedule, and more — all from a single command bar.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
