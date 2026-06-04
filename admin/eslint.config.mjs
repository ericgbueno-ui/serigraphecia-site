import nextConfig from "eslint-config-next/core-web-vitals";
import prettierConfig from "eslint-config-prettier";

const config = [
  { ignores: [".claude/**", ".next/**", "node_modules/**", "dist/**"] },
  ...nextConfig,
  prettierConfig,
];
export default config;
