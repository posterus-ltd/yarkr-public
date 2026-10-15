# time

The MCP reference time server (`mcp-server-time`, run with `uvx`): `get_current_time` in any timezone and `convert_time` between timezones, using IANA names such as `Europe/Warsaw` or `America/New_York`. Stops the model guessing today's date or doing timezone arithmetic in its head.

## Variables

None. The local timezone is detected automatically; to override it, add `--local-timezone=<IANA name>` to `args`.

## Notes

- Requires `uv` (for `uvx`).
- Timezone names are case-sensitive.

Docs: https://github.com/modelcontextprotocol/servers/tree/main/src/time
