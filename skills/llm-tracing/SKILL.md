---
name: llm-tracing
description: Instrument LLM apps and agents with traces of prompts, completions, tool calls, retrieval, tokens, cost and latency using OpenTelemetry GenAI conventions and a backend like Langfuse or Phoenix. Use when adding LLM observability, debugging agents, or feeding production traces into evals.
---

# LLM tracing

A trace should let someone reconstruct exactly what the model saw and did for one user request: every prompt,
retrieved chunk, tool call and result, with tokens, cost and timing. Without it, error analysis and eval building from
production are guesswork.

## 1. Trace shape

One trace per user request (or agent task), with nested spans:

```text
invoke_agent support-bot                 (root: user id hash, session id, app version, prompt version)
├── retrieve docs                        (query, rewritten query, top-k ids + scores)
├── chat <model>                         (messages in/out, tokens, finish reason)
├── execute_tool lookup_order            (arguments, result or error, duration)
├── chat <model>
└── guardrail output-check               (verdict)
```

Group traces into sessions/conversations with a session id. Attach user feedback (thumbs, edits, escalations) to the
trace id later; that link is what makes traces useful for evals.

## 2. Use OpenTelemetry GenAI conventions

OpenTelemetry defines GenAI semantic conventions (still marked as development, so pin the version you follow). Use its
attribute names so any backend can read your spans:

| Attribute | Example |
| --- | --- |
| `gen_ai.operation.name` | `chat`, `embeddings`, `execute_tool`, `invoke_agent` |
| `gen_ai.request.model` / `gen_ai.response.model` | requested vs actually served model |
| `gen_ai.request.temperature`, `gen_ai.request.max_tokens` | sampling params |
| `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens` | token counts from the response |
| `gen_ai.response.finish_reasons` | `["stop"]`, `["tool_calls"]`, `["length"]` |
| `gen_ai.tool.name`, `gen_ai.tool.call.id` | on tool execution spans |

Span name convention: `"{operation} {model or tool}"`, e.g. `chat claude-...`, `execute_tool lookup_order`.
Prompt and completion content is opt-in in the conventions because it may contain sensitive data; decide explicitly
whether to capture it (you usually need it for debugging, with redaction).

Manual instrumentation sketch (Python):

```python
from opentelemetry import trace
tracer = trace.get_tracer("support-bot")

def call_llm(client, model, messages, **params):
    with tracer.start_as_current_span(f"chat {model}") as span:
        span.set_attribute("gen_ai.operation.name", "chat")
        span.set_attribute("gen_ai.request.model", model)
        resp = client.create(model=model, messages=messages, **params)
        span.set_attribute("gen_ai.usage.input_tokens", resp.usage.input_tokens)
        span.set_attribute("gen_ai.usage.output_tokens", resp.usage.output_tokens)
        return resp
```

Prefer existing auto-instrumentation for your SDK or framework (OpenTelemetry contrib GenAI instrumentations,
OpenLLMetry, OpenInference, or the backend's own SDK) and add manual spans only for your own steps: retrieval,
guardrails, business logic.

## 3. Pick a backend

| Option | Notes |
| --- | --- |
| Langfuse | Open source, self-hostable or cloud; traces, prompt management, datasets, scores; accepts OTLP |
| Arize Phoenix | Open source; OpenInference instrumentation; strong for RAG and eval workflows |
| LangSmith | Tight LangChain/LangGraph integration, also SDK for any code |
| Your APM (Datadog, Honeycomb, Grafana/Tempo) | Fine for latency/cost; weaker for reading long prompts and attaching evals |

Export via OTLP where possible so you can switch backends. Configure credentials only through environment variables
(e.g. `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`, or the backend SDK's documented key variables).

## 4. What to record

- Versions: app version, prompt template id + version, model snapshot, retrieval index version.
- Inputs/outputs per LLM call (redacted), tool arguments and results, retrieved ids and scores.
- Tokens, computed cost (price table keyed by model), latency per span, time to first token for streaming.
- Errors, retries, rate-limit waits, fallbacks to other models.
- Outcome signals: user feedback, task success flags, guardrail verdicts, online judge scores.

## 5. Privacy and cost controls

- Redact PII and secrets before export (emails, phone numbers, card numbers, API keys); do it in a span processor so it
  applies everywhere.
- Set retention per data class; restrict who can read raw prompts.
- Sample: keep 100% of errors and negative feedback, a percentage of normal traffic.
- Never log full documents if references (ids) suffice.

## 6. Use traces

- Error analysis: sample traces with negative feedback or low judge scores (see `llm-error-analysis`).
- Eval building: promote reviewed traces into datasets with their inputs and the corrected expected output.
- Online evaluation: run cheap judges or checks on sampled traces and attach scores to the trace.
- Dashboards: cost per request, tokens by model, p95 latency per span type, tool error rate, finish_reason=length rate.

## Pitfalls

- Logging only the final answer, not the prompts and tool results that produced it.
- No prompt/model version on the trace, so regressions cannot be attributed.
- Capturing raw PII into a third-party backend.
- Separate traces per LLM call with no parent, so an agent run cannot be reconstructed.
- Feedback stored in another system with no trace id.
