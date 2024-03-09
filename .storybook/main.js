/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {

  static: [
    "../blocks/**/*.@(webp)"
  ],

  stories: [
    "../blocks/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/html-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
