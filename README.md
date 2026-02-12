# cc-codecopy

Copy individual code blocks from Claude Code responses to your clipboard. No more terminal text selection.

## The problem

Claude gives you a response with 3 code blocks. You want block 2. Your options:
- Carefully mouse-select the exact lines in the terminal (good luck with line wrapping)
- `/copy` the entire response and manually trim it
- Give up and retype it

## The fix

```
/cc-codecopy:cb        → lists blocks, you pick one
/cc-codecopy:cb 2      → copies block 2 directly
/cc-codecopy:cb last   → copies the last block
/cc-codecopy:cb all    → copies all blocks
```

Clean text on your clipboard. No ANSI codes, no fence markers, no surrounding prose.

## Install

### From a marketplace

```
/plugin install <marketplace-url>
```

### Manual (local)

Clone this repo and load it directly:

```bash
git clone https://github.com/Pickle-Pixel/cc-codecopy.git
claude --plugin-dir /path/to/cc-codecopy
```

### Quick test (no install)

```bash
claude --plugin-dir ./cc-codecopy
```

## How it works

`/cc-codecopy:cb` is a slash command that tells Claude to:

1. Look at its own last response
2. Extract fenced code blocks
3. Pipe the one you pick to your system clipboard (`clip.exe` / `pbcopy` / `xclip`)

Zero dependencies. No API calls beyond the command invocation itself. Works on Windows, macOS, and Linux.

## Examples

Claude shows you a long response with a Docker command buried in it:

```
/cc-codecopy:cb
```

```
Code blocks in last response:
  1. [bash]   docker run -d --name postgres -e POS...  (4 lines)
  2. [yaml]   version: "3.8"...                        (22 lines)
  3. [bash]   psql -U admin -d myapp -c "CREATE TA...  (1 line)

Which block? (1-3, "all", or "last")
```

Type `1` — done. It's on your clipboard.

Or skip the menu entirely:

```
/cc-codecopy:cb 1
```

## License

MIT
