import nextConfig from "eslint-config-next";

export default [
  {
    ignores: ["dist/**", ".next/**", "out/**", "src-tauri/target/**"],
  },
  ...nextConfig,
];
