# browserstack

BrowserStack's official remote MCP server (hosted by BrowserStack): open apps and websites on real devices and browsers, run and debug automated Playwright, Selenium and other test suites on BrowserStack, get root-cause analysis for failures, run accessibility scans, manage Test Management projects, cases and runs, and start and compare load tests. Five core tools (`searchCapability`, `invokeCapability`, ...) let the agent find and run any BrowserStack capability without loading every tool.

## Variables

None required: the server uses OAuth. Your client opens a browser to sign in to BrowserStack on first use.

## Notes

- The remote server can't reach localhost, VPN or firewalled targets; for Local Testing use BrowserStack's local MCP server (Node.js 22+, BrowserStack username and access key), per their docs.
- Capabilities that change data ask for approval through `invokeCapability`; RCA fixes are returned as proposals, never applied automatically.
- Load tests consume your plan's VU-hours; ask the agent to check the remaining quota before large runs.

Docs: https://www.browserstack.com/docs/browserstack-mcp-server/get-started/remote-mcp-server
