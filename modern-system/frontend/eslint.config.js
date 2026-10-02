import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Client-side data fetching is what these dashboards are: a component
      // mounts, calls the API and renders the result. This rule exists to catch
      // derived state being written during render, which is not what happens
      // here — every setState below runs inside an async callback, never
      // synchronously in the effect body.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // AuthContext and axios.js legitimately mix a component/provider with
    // helpers (context creation, storage keys). Fast refresh cannot track that,
    // so these files are exempted rather than contorted into extra files.
    files: ['src/contexts/AuthContext.jsx', 'src/api/axios.js'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
