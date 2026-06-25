import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "EmGlodAi",
  description: "One box. Every tool.",
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
