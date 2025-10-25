import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// 1. Define your config
const myConfig = {
  rules: {
    // 2. Add this line to turn off the apostrophe rule
    "react/no-unescaped-entities": "off",
  },
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  // 3. Add your new config to the array
  myConfig,
];

export default eslintConfig;
