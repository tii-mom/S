module.exports = {
  preset: "ts-jest",
  globalSetup: "./jest.setup.ts",
  cache: false,
  testEnvironment: "@ton/sandbox/jest-environment",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  reporters: ["default", ["@ton/sandbox/jest-reporter", {}]],
};
