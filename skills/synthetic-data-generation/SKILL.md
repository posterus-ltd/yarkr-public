---
name: synthetic-data-generation
description: Generate synthetic eval and training data with LLMs - dimension/persona grids for diversity, seeded generation, quality filtering, dedup, human review and contamination checks. Use when real data is scarce for some slices, when bootstrapping an eval set, or when generating fine-tuning examples.
---

# Synthetic data generation

Synthetic data is useful when it fills a gap you can name, and harmful when it replaces real data or drifts into the
model's comfort zone. Generate with structure, filter hard, review a sample, and label it as synthetic forever.

## 1. Define the gap and the dimensions

Write what is missing ("refund questions in German from frustrated users", "multi-step tool tasks with an invalid
argument") and list the dimensions that vary in real usage:

```yaml
dimensions:
  intent: [refund, plan-change, cancel, invoice-copy, outage-report]
  persona: [new user, admin of 500-seat org, non-native speaker, angry repeat contact]
  complexity: [single question, two intents, missing key info, contradicts earlier message]
  channel: [chat, email]
  language: [en, de, es]
```

Sample combinations (all, or a stratified subset) and generate one item per combination. Asking a model for "50 diverse
questions" in one call produces repetitive, generic output; a grid forces diversity.

## 2. Generate in two steps

1. **Generate inputs** from each tuple, with a few real examples as style anchors (rotate which examples you show):

```text
Write one realistic customer message.
Intent: {intent}. Persona: {persona}. Complexity: {complexity}. Channel: {channel}. Language: {language}.
Match the tone and length of real messages like these:
{3 sampled real examples}
Output only the message.
```

2. **Generate or write expected outputs / rubrics separately.** For eval data, expected behaviour should come from
   policy docs and humans, not from the model under test. For training data, generate with a stronger model or with
   retrieval over the ground-truth source, then verify.

Other seeds that work: real documents (generate questions answerable from a passage, for RAG evals), real failures
(generate variations of a failing case), templates with slot values, and perturbations (typos, paraphrase, injection
attempts) of real inputs.

## 3. Filter

Apply in order, logging how many items each filter removes:

- **Format/validity**: schema checks, language detection, length bounds.
- **Dedup**: exact hash, then near-duplicate by embedding cosine (e.g. > 0.92) or MinHash; keep one per cluster.
- **Quality judge**: a calibrated binary judge on "realistic and on-spec for the tuple" (see `llm-as-judge`).
- **Answerability / correctness**: for RAG questions, check the source passage really answers it; for code, execute.
- **Diversity check**: plot embedding clusters or count n-gram overlap; regenerate thin regions.

Expect to discard 20-50%. A low discard rate usually means weak filters.

## 4. Human review

- Review at least a random 10% (all of it for eval sets under ~300 items). Reviewers mark realistic / unrealistic and
  correct expected outputs.
- If more than ~15% are rejected, fix the generation prompt and regenerate instead of hand-patching.

## 5. Contamination and leakage

- Never generate eval items from the same examples used in the system prompt or few-shot examples.
- Check overlap between synthetic training data and eval sets (n-gram overlap and embedding near-duplicates); remove
  matches from training data.
- If using public benchmarks, assume frontier models may have seen them; prefer private, fresh items for decisions.
- Keep generator ≠ system under test where possible, to avoid evaluating a model on its own style.

## 6. Record provenance

Every item gets `source: synthetic`, generator model + version, prompt version, seed tuple, filter results, and review
status. Report metrics separately for real and synthetic slices; if they diverge a lot, the synthetic data is not
representative.

## Training-data specifics

- Mix synthetic with real data; track the ratio and ablate it.
- Watch for mode collapse: repeated openings, uniform length, identical structure. Measure distinct-n and length
  distributions against real data.
- Check licence and terms of the generator model for using outputs to train other models.

## Pitfalls

- One giant "generate 100 examples" prompt.
- Expected answers produced by the model being evaluated.
- No dedup, so the set is 30 paraphrases of five questions.
- Synthetic items silently mixed into the real set, inflating scores.
- PII copied from seed examples into generated data.
