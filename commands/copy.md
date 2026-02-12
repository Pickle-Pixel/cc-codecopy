---
description: Copy a specific code block from the last response to your clipboard
argument-hint: "[block-number | last | all]"
disable-model-invocation: true
allowed-tools: Bash
---

# Copy Code Block

Look at your **last assistant message** in this conversation (the message immediately before the user invoked this command). Extract every fenced code block — text between triple-backtick (```) delimiters.

## Behavior

### With argument: `/cc:copy <arg>`

| Argument | Action |
|----------|--------|
| **Number** (e.g. `2`) | Copy that code block directly (1-indexed). No listing. |
| **`last`** | Copy the last code block in the response. |
| **`all`** | Copy all code blocks joined by two blank lines between them. |

If the number is out of range, say: "Block N doesn't exist. Last response has X code blocks (1-X)."

### Without argument: `/cc:copy`

If there is **exactly 1** code block, copy it directly — don't make the user choose.

If there are **2 or more**, show a compact numbered list:

```
Code blocks in last response:
  1. [bash]   llama-server -m Qwen2.5-Coder-14B-I...  (3 lines)
  2. [python] def process_data(input_file):...        (12 lines)
  3. [text]   {"name": "config", "version":...        (8 lines)

Which block? (1-3, "all", or "last")
```

Format per line: `N. [lang] preview...  (line_count lines)`
- **lang**: the language tag from the opening fence (use `text` if none)
- **preview**: first 40 characters of the first non-empty line, with `...` if truncated
- **line_count**: number of lines in the block

Then wait for the user's response.

## Copying to clipboard

Use the Bash tool to pipe the clean code content to the system clipboard.

Detect the platform and pick the right command:
- **Windows / Cygwin / MSYS**: `clip.exe`
- **macOS**: `pbcopy`
- **Linux**: `xclip -selection clipboard` (if unavailable, try `xsel --clipboard`)

For multi-line content, use a heredoc with a unique quoted delimiter so special characters are preserved:

```bash
cat <<'__CB_EOF__' | clip.exe
<code content here>
__CB_EOF__
```

## Rules

1. **Only extract from your last assistant message.** Ignore tool call results, system messages, and earlier messages.
2. **Strip fence markers.** The opening ``` line (including the language tag) and closing ``` must NOT be in the copied text. Copy only the content between them.
3. **Preserve whitespace exactly.** Indentation, blank lines, trailing spaces — all preserved verbatim.
4. **No extra wrapping.** Do not add comments, headers, explanations, or formatting around the copied content.
5. **Confirm briefly.** After a successful copy, respond with exactly one line: `Copied block N to clipboard.` (or `Copied all N blocks to clipboard.` for "all"). Nothing more.
6. **No code blocks found?** Say: `No code blocks in last response.`
