// The CSS file is handled by Next.js at build time and has no TypeScript declarations.
// @ts-expect-error Next.js resolves this side-effect CSS import.
import "./globals.css";
export const metadata = { title: "Organization Chart" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
