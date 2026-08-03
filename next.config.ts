import type { NextConfig } from "next";

// Suppress experimental warning for localStorage in Node 22+
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("warning", (warning) => {
    if (
      warning.name === "ExperimentalWarning" &&
      warning.message.includes("localStorage")
    ) {
      return;
    }
    // Print other warnings as normal
    console.warn(warning.stack || warning.message);
  });
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
