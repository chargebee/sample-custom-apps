export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/test/**/*.test.mjs"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov"],
  collectCoverageFrom: ["handlers/**/*.mjs"],
  coveragePathIgnorePatterns: ["/node_modules/"],
};
