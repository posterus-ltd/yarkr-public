# figma

Figma's official hosted MCP server: gives the agent design context from Figma files (layout, variables, components, screenshots, FigJam and Make resources), generates code from selected frames with Code Connect mappings, and writes native content back to the canvas in Figma Design, FigJam and Slides.

## Variables

None required: sign in with your Figma account in the browser on first use (in Claude Code, run `/mcp`, select `figma` and authenticate).

## Notes

- Point the agent at a design by pasting a "Copy link to selection" URL into the prompt.
- Writing to the canvas outside your drafts needs a Full seat; it is free during beta and planned as usage-based.
- Rate limits depend on your plan and seat. A desktop server (via the Figma desktop app) exists for specific enterprise needs.
- Figma also ships skills for its MCP tools; install them separately when using write-to-canvas.

Docs: https://developers.figma.com/docs/figma-mcp-server/
