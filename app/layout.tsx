import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "../components/providers/QueryProvider";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";

export const metadata: Metadata = {
  title: "NovaMind AI | Real-time Collaborative Chat & AI Assistant",
  description: "Next-generation secure chat application with real-time features, premium design systems, and AI companionship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 transition-colors duration-250">
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

