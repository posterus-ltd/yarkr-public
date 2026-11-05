# firebase

Firebase's official MCP server, built into the Firebase CLI (`firebase-tools`, run with `npx`): list and inspect Firebase projects and apps, fetch SDK config, manage Authentication users, read and write Cloud Firestore data, validate security rules, read Crashlytics issues, fetch App Hosting logs, work with Data Connect, Remote Config, Cloud Storage and Cloud Messaging, and run prompts such as `firebase:init` and `firebase:deploy`.

## Variables

None required: the server uses the same credentials as the Firebase CLI. Run `npx firebase-tools@latest login` once (or use Application Default Credentials); the `firebase_login` tool can also start sign-in. Use an account with access only to the projects the agent should touch.

## Notes

- Requires Node.js and npm (for `npx`). It runs locally, though some tools proxy to Firebase backends.
- Add `--dir <absolute path>` to pin the project directory containing `firebase.json`, and `--only auth,firestore,storage` (comma-separated feature groups) to limit the tools exposed; core tools are always available.
- Tools can change live data (Auth users, Firestore documents, Remote Config) and deploy: point it at a development project and keep writes behind approval prompts.

Docs: https://firebase.google.com/docs/ai-assistance/mcp-server
