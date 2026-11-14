import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./memes.css";
import { fontVars } from "@/lib/fonts";
import { GenerationProvider } from "./memes/ui/Generation";

export const metadata: Metadata = {
  title: "Caption Club",
  description: "Upload a photo, AI writes five captions, the crowd votes on the funniest.",
};

export const viewport: Viewport = {
  themeColor: "#17111C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <GenerationProvider>{children}</GenerationProvider>
      </body>
    </html>
  );
}
