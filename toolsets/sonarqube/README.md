# sonarqube

SonarSource's official SonarQube MCP server (Docker image `sonarsource/sonarqube-mcp`, run locally): analyze code snippets or files for bugs, vulnerabilities and code smells, list and triage issues and security hotspots, check quality gate status, read measures, coverage, duplications and dependency risks, and look up rules for projects in SonarQube Cloud or SonarQube Server.

## Variables

- `SONARQUBE_TOKEN`: a SonarQube token, passed into the container as an environment variable. Generate it in your SonarQube account; for SonarQube Server it must be a user token. Use an account with access only to the projects the agent works on.
- `SONARQUBE_ORG`: your SonarQube Cloud organization key.

## Notes

- Requires Docker.
- SonarQube Server: replace `SONARQUBE_ORG` with `SONARQUBE_URL` (your server URL) in both `args` and `env`. SonarQube Cloud US: also pass `SONARQUBE_URL=https://sonarqube.us`.
- Set `SONARQUBE_READ_ONLY=true` (and `-e SONARQUBE_READ_ONLY`) to disable write tools such as changing issue status; `SONARQUBE_TOOLSETS` limits which tool groups load.
- Mount the project at `/app/mcp-workspace` (`-v /path/to/project:/app/mcp-workspace`) so analysis reads files from disk instead of passing them through the agent's context.

Docs: https://github.com/SonarSource/sonarqube-mcp-server
