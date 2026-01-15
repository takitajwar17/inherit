import { ClerkProvider } from "@clerk/nextjs";
import { light } from "@clerk/themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Kanit } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClientLayout from "./components/ClientLayout";
import "./globals.css";

import { RootErrorBoundary } from "@/components/error";
import AICompanion from "@/components/companion/AICompanion";

const kanit = Kanit({
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

// Custom Metadata
export const metadata = {
  title: "Inherit",
  description: "Inherit: A Unified Learning & Coding Platform",
  openGraph: {
    type: "website",
    url: "https://Inherit.vercel.app",
    title: "Inherit",
    description: "Inherit: A Unified Learning & Coding Platform",
    image:
      "https://raw.githubusercontent.com/takitajwar17/Inherit/refs/heads/main/public/inherit.png",
  },
};

/**
 * RootLayout - Root layout component for the entire application
 *
 * @description
 * Wraps the entire app with ClerkProvider for authentication,
 * ClientLayout for sidebar/header management, and global components.
 *
 * Note: The <main> tag is in ClientLayout to avoid duplicate main tags.
 */
export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: light,
      }}
    >
      <html lang="en">
        <head>
          <meta property="og:type" content={metadata.openGraph.type} />
          <meta property="og:url" content={metadata.openGraph.url} />
          <meta property="og:title" content={metadata.openGraph.title} />
          <meta
            property="og:description"
            content={metadata.openGraph.description}
          />
          <meta property="og:image" content={metadata.openGraph.image} />
        </head>
        <body className={kanit.className}>
          {/* RootErrorBoundary protects the entire app from critical errors */}
          <RootErrorBoundary>
            {/* ClientLayout manages header, sidebar, and main content area */}
            <ClientLayout>{children}</ClientLayout>

            <AICompanion />
            <ToastContainer />
            <Analytics />
            <SpeedInsights />
          </RootErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
