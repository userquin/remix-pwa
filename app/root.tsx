import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { pwaInfo } from "virtual:pwa-info";
import { pwaAssetsHead } from "virtual:pwa-assets/head";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
          {pwaAssetsHead.themeColor ? (
              <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
          ) : null}
          {pwaAssetsHead.links.map((l) => (
              <link key={l.id ?? l.href} {...l} />
          ))}
          {pwaInfo ? (
              <link rel='manifest' href={pwaInfo.webManifest.href} />
          ) : null}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
