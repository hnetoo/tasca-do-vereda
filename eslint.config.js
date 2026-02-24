import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: ["dist/**", ".next/**", "out/**", "src-tauri/target/**"],
  },
  ...nextConfig,
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@next/next/no-img-element": "off"
    }
  }
];

export default eslintConfig;
