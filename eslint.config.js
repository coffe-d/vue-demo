import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  // ---- 全局忽略 ----
  { ignores: ['dist', 'node_modules', '*.d.ts'] },

  // ---- JS/TS 基础推荐 ----
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---- Vue 推荐 ----
  ...pluginVue.configs['flat/recommended'],

  // ---- Prettier：关闭冲突规则 ----
  prettierConfig,

  // ---- 项目自定义规则 ----
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021, ...globals.node },
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // ===== TypeScript 命名规范 =====
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'method',
          format: ['camelCase'],
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        // 对象属性：camelCase / PascalCase / UPPER_CASE（http headers）/ 含横杠的 key
        {
          selector: 'objectLiteralProperty',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
          filter: { regex: '^(Content-Type|Authorization|.*-.*)$', match: false },
        },
        // 类型/接口/泛型参数：PascalCase
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'typeParameter', format: ['PascalCase'] },
        // 枚举成员：PascalCase 或 UPPER_CASE
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
      ],

      // ===== 通用 =====
      'no-console': 'off',
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',

      // ===== Vue 组件规范 =====
      'vue/multi-word-component-names': 'off', // 页面命名允许单字（Login/Dashboard）
      // Ant Design 全局组件在模板中使用 kebab-case，不检查
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        { registeredComponentsOnly: true },
      ],
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/match-component-file-name': 'error',
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      // Ant Design 组件属性使用 camelCase（如 allowClear、dataSource）
      'vue/attribute-hyphenation': 'off',
      'vue/no-undef-components': 'off',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'warn',
      'vue/html-self-closing': ['warn', { html: { void: 'always', normal: 'never' } }],
      'vue/max-attributes-per-line': ['warn', { singleline: 5, multiline: 1 }],
      // 属性顺序：class/style 优先，然后是指令，最后是事件
      'vue/attributes-order': [
        'warn',
        { order: ['DEFINITION', 'LIST_RENDERING', 'CONDITIONALS', 'RENDER_MODIFIERS', 'GLOBAL', 'UNIQUE', 'SLOT', 'TWO_WAY_BINDING', 'OTHER_DIRECTIVES', 'OTHER_ATTR', 'EVENTS', 'CONTENT'], alphabetical: false },
      ],
      'vue/return-in-computed-property': 'error',
    },
  },

  // ---- .vue 文件解析器 ----
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
)
