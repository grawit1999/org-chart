// css
import "./globals.css";
export const metadata = { title: "Organization Chart" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
