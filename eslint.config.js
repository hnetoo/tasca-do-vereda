module.exports = [
  {
    ignores: ["dist/**", ".next/**", "out/**", "src-tauri/target/**"],
  },
  ...require("eslint-config-next"),
];
