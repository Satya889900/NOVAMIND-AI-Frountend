import type { Metadata, Viewport } from "next";
import "./globals.css";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://novamind.ai"),

  title: {
    default: "NovaMind AI",
    template: "%s | NovaMind AI",
  },

  description:
    "NovaMind AI is a real-time conversational AI platform powered by Gemini, offering intelligent chat, document understanding, and collaborative AI experiences.",

  applicationName: "NovaMind AI",

  keywords: [
    "AI Chat",
    "Gemini API",
    "Next.js",
    "Node.js",
    "ChatGPT Clone",
    "Socket.IO",
    "RAG",
    "LangChain",
    "AI Assistant",
  ],

  authors: [
    {
      name: "Satya Prakash",
    },
  ],

  creator: "Satya Prakash",

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "NovaMind AI",
    description:
      "Modern AI Assistant with real-time streaming and document intelligence.",
    type: "website",
    locale: "en_US",
    siteName: "NovaMind AI",
  },

  twitter: {
    card: "summary_large_image",
    title: "NovaMind AI",
    description:
      "Real-time AI Chat Application powered by Gemini.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="scroll-smooth"
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    const root = document.documentElement;

    let theme = localStorage.getItem("theme") || "system";

    const systemDark =
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const resolved =
      theme === "system"
        ? (systemDark ? "dark" : "light")
        : theme;

    root.classList.remove("light", "dark");

    root.classList.add(resolved);

    root.dataset.theme = resolved;

    root.style.colorScheme = resolved;

  } catch (e) {}
})();
`,
          }}
        />
      </head>

      <body
        suppressHydrationWarning
        className="
          min-h-screen
          antialiased
          bg-background
          text-foreground
          transition-colors
          duration-300
        "
      >
        <QueryProvider>

          <ThemeProvider>

            <AuthProvider>

              <ChatProvider>

                {children}

              </ChatProvider>

            </AuthProvider>

          </ThemeProvider>

        </QueryProvider>
      </body>
    </html>
  );
}