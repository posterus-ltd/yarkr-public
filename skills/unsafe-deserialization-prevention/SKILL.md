---
name: unsafe-deserialization-prevention
description: Detect unsafe deserialization (pickle, Java native, unsafe YAML, PHP unserialize, BinaryFormatter, polymorphic JSON) and migrate to safe formats and type-restricted parsers. Use when code loads cookies, caches, queue messages, uploads or model files, or to fix a deserialization finding.
---

# Unsafe deserialization prevention

Native object deserializers can instantiate arbitrary types and run code during loading. If an attacker controls
the bytes, assume remote code execution. The fix is to stop deserializing objects from untrusted input and parse
plain data with a schema instead.

## 1. Find the sinks

```bash
rg -n -e 'pickle\.loads?|cPickle|dill\.loads?|joblib\.load|torch\.load|shelve\.open|marshal\.loads' \
      -e 'yaml\.load\(|yaml\.unsafe_load|Loader=yaml\.(Unsafe)?Loader|FullLoader' \
      -e 'ObjectInputStream|readObject\(|XMLDecoder|XStream|enableDefaultTyping|activateDefaultTyping|@JsonTypeInfo' \
      -e 'unserialize\(' -e 'BinaryFormatter|NetDataContractSerializer|LosFormatter|SoapFormatter|TypeNameHandling\.(All|Auto|Objects)' \
      -e 'Marshal\.load|YAML\.load\(|Oj\.load' -e 'node-serialize|serialize-javascript.*eval|funcster'
```

## 2. Decide if the input is untrusted

Untrusted means anything an attacker can write or tamper with: request bodies, cookies, headers, uploaded files,
queue/cache entries reachable by other tenants or services, files in shared buckets, downloaded model weights, and
data signed with a key that might leak. "It's only internal" is not enough when the producer is less trusted than
the consumer.

## 3. Language rules

### Python
- `pickle`, `dill`, `joblib`, `shelve`, `marshal`: never on untrusted data. Use JSON/msgpack + schema validation
  (pydantic, msgspec).
- PyYAML: `yaml.safe_load` / `Loader=yaml.SafeLoader` only. `FullLoader` and `UnsafeLoader` are not safe for
  untrusted input. `ruamel.yaml`: use `YAML(typ="safe")`.
- PyTorch: `torch.load(path, weights_only=True)` (the default since PyTorch 2.6) and prefer `safetensors` for model
  weights. Treat third-party `.pkl`/`.pt`/`.joblib` model files as code.

### Java / JVM
- Avoid `ObjectInputStream.readObject` on external data. If unavoidable, set a JEP 290 deserialization filter
  allowlisting exact classes (`ObjectInputFilter.Config.createFilter("com.example.Msg;java.base/*;!*")`).
- Jackson: do not enable default typing; avoid `@JsonTypeInfo(use = Id.CLASS)`; if polymorphism is needed use
  `Id.NAME` with registered subtypes or a `PolymorphicTypeValidator` allowlist.
- XStream: use `allowTypes`/`allowTypesByWildcard` with an explicit allowlist; `XMLDecoder` never on input.
- SnakeYAML: construct with `SafeConstructor` (SnakeYAML 2.x defaults to restricting global tags).

### .NET
- `BinaryFormatter` is obsolete and removed from .NET 9; replace with `System.Text.Json` or protobuf.
- Newtonsoft.Json: `TypeNameHandling.None` (default). If you must, use a strict `SerializationBinder`.

### PHP
- Never `unserialize()` user input; use `json_decode`. If legacy code must, pass
  `['allowed_classes' => false]`. Beware `phar://` wrappers on file functions with user-controlled paths.

### Ruby
- `Marshal.load` never on input; `YAML.safe_load` (Psych 4 makes `YAML.load` safe by default, but be explicit);
  `Oj` in `:strict` or `:compat` mode.

### JavaScript
- `JSON.parse` is safe from code execution; validate shape with zod/ajv. Never `eval` or `new Function` on payloads,
  and avoid libraries that serialize functions (`node-serialize`).
- Watch for prototype pollution when merging parsed objects (`__proto__`, `constructor`): use schema validation,
  `Object.create(null)`, or libraries that block these keys.

## 4. Migration pattern

1. Define the message as a schema (JSON Schema, pydantic model, protobuf, Avro).
2. Producer writes the new format; consumer accepts both, preferring the new one, for one release.
3. Consumer drops the native format; remove the deserializer import entirely.
4. If integrity matters (cookies, cache entries), add an HMAC or use an AEAD envelope; signing does not make an
   unsafe format safe if the key ever leaks, so do both: safe format **and** integrity.

## 5. Defence in depth when removal is slow

- Run the consumer with least privilege, no outbound network, read-only filesystem.
- Restrict classes via filters/binders as above.
- Monitor for deserialization errors and unexpected class names.
- Keep gadget-bearing libraries (commons-collections, etc.) patched, but do not rely on this.

## Review checklist

- [ ] No native/object deserializer on data that crosses a trust boundary.
- [ ] YAML loaded with safe loaders only.
- [ ] JSON polymorphism uses registered names, not class names from the payload.
- [ ] Model files loaded with `weights_only=True` or from `safetensors`; sources pinned and verified.
- [ ] Signed cookies/session stores use JSON serializers, not pickle (e.g. Django `JSONSerializer`).

## Pitfalls

- Base64-encoding a pickle in a cookie and signing it with a secret that is committed to the repo.
- Assuming a type check after `loads()` helps: the payload has already executed during loading.
- Treating Hugging Face or pip-downloaded model files as data.
