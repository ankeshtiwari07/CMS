/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* The Payload admin UI mounts here. Custom HUMAIN surfaces live in apps/studio. */
import type { ServerFunctionClient } from "payload";
import config from "@payload-config";
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import React from "react";

import { importMap } from "./admin/importMap.js";
// Canonical HUMAIN tokens first, then our Payload-token mapping on top.
import "@humain/foundation/tokens.css";
import "@humain/design-tokens/bridge.css";
import "./custom.scss";
import ThemeClassBridge from "./theme-class-bridge";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    <ThemeClassBridge />
    {children}
  </RootLayout>
);

export default Layout;
