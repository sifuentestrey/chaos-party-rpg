# Local Qwen game master — connection implemented, weights not installed here

The optional server-side interpreter targets **Qwen3 1.7B**, an Apache-2.0 open-weight model. Official model information: https://github.com/QwenLM/Qwen3 . Its smaller size is a starting point for CPU testing, not a claim that the 2015 Mac can run it fast enough. No model weights, paid API, proprietary inference runtime or credentials are bundled.

## What is implemented

The real multiplayer server connects to a local OpenAI-compatible inference endpoint, such as Ollama or llama.cpp. Default: `http://127.0.0.1:11434/v1`, model `qwen3:1.7b`. `CHAOS_AI_BASE_URL` and `CHAOS_AI_MODEL` select an already-running local model. The endpoint must be a loopback/private HTTP address; public/cloud addresses and credentials are rejected. `CHAOS_AI=off` disables the optional interpreter.

Normal startup checks whether that model is available. Host controls show status and provide **Check local AI**. No model is downloaded by starting the game.

An accepted declaration locks before inference starts. Qwen receives the attempted text, public scene objects and changed states, positions, inventory, NPC circumstances and recent outcomes. Tokens, PINs, request receipts and RNG seed are excluded. It returns one bounded action/target interpretation. The server checks that proposal against the known verb/target list; it cannot accept arbitrary HP, inventory, reward, dice or quest mutations. The locked original text remains intact in history.

Inference runs during the existing reaction window, at most once per accepted turn, with a deadline of at most 5.5 seconds and time reserved for animation. Reactions continue while it runs. Slow, unavailable, invalid, paused or stale responses fall back to the existing rules. Results arriving after resolution cannot rewrite the outcome. Narration remains scripted; this is an action interpreter, not a fully generative narrator or unrestricted world simulator.

## Model runner

On a compatible computer with Ollama already installed, `ollama pull qwen3:1.7b` installs the free model; `ollama serve` provides its local endpoint. Start the game normally, or use **Check local AI** if the game was already running. A one-time model download is roughly 1–2 GB. The runner may need prewarming before it can meet gameplay deadlines.

The intended 2015 Mac may not support current Ollama releases. Use a compatible CPU build of llama.cpp or run the model on another computer on the same private LAN and configure its private endpoint. Do not promise compatibility or speed without actual hardware tests. No installer is silently added to the Mac package.

Developer readiness test: `npm run ai:check`. It asks the real configured model to interpret “Make that carpet mine,” validates the response, and reports latency. It exits unsuccessfully if no real model is available or the response is wrong. It uses an isolated room and never opens a saved campaign.

## Verified in this cloud session

- All 42 game/integration tests pass, including genuine multiplayer.
- Real local HTTP protocol tests use a **simulated model endpoint**, not Qwen weights. They cover structured request format, timeout, first-declaration locking, deduplication, reactions, blocked client-injected plans and rejection of late responses.
- A real browser host/controller flow verifies the AI-check control and clear no-model fallback.
- `npm run ai:check` reports that no real Qwen model is connected and exits unsuccessfully, as it should.
- The official Hugging Face model-download request is blocked by this environment's network policy (HTTP 403). Model weights, actual Qwen reasoning quality and real inference speed are **not verified**. Download access is the remaining prerequisite for that test; a configuration draft is not proof it has been applied.

The saved environment draft adds only `huggingface.co`, `cas-bridge.xethub.hf.co` and `cdn-lfs.huggingface.co` for official model files and their delivery hosts. Existing package-manager access is preserved. Review/save and publication of that environment update are required before retrying the download.

## Prepared inference runtime

The cloud worker now has a CPU build of llama.cpp tag `b5401` at `/workspace/chaos-ai-runtime/llama.cpp/build/bin/llama-server`. The source archive SHA-256 is `140f105308371c79e5a7f2f0e111481c24ff1342e44cae2bc0cedd2808d8e24c`; its MIT notice remains in the source tree. CMake 3.31.6, source build, `--version` and `--help` were executed. Archive builds report `version: 0 (unknown)` because Git metadata is absent; the archive hash pins the actual source. The executable is prepared, not running an installed model. The saved environment installation/startup instructions preserve that distinction. This Linux runtime is not bundled as a Mac binary.
