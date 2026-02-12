# cc-codecopy

Copy individual code blocks from Claude Code responses to your clipboard. Instant, zero API cost.

## The problem

Claude gives you a response with 3 code blocks. You want block 2. Your options:
- Carefully mouse-select the exact lines in the terminal (good luck with line wrapping)
- `/copy` the entire response and manually trim it
- Give up and retype it

## The fix

```
ccb          → shows blocks, you pick one
ccb 2        → copies block 2 instantly
ccb last     → copies the last block
ccb all      → copies all blocks
```

Clean text on your clipboard. No ANSI codes, no fence markers, no surrounding prose. **Zero API calls** — reads session files directly.

## Install

```bash
npm install -g cc-codecopy
```

Or run without installing:

```bash
npx cc-codecopy
```

## Usage

Run `ccb` in a separate terminal while Claude Code is open:

```
$ ccb

Code blocks in last response:

  1. [bash]   docker run -d --name postgres -e POS...  (4 lines)
  2. [yaml]   version: "3.8"...                        (22 lines)
  3. [bash]   psql -U admin -d myapp -c "CREATE TA...  (1 line)

Block? (1-3, all, last): 1
Copied block 1 [bash] to clipboard.
```

Skip the menu:

```
$ ccb 2
Copied block 2 [yaml] to clipboard.
```

If there's only one code block, `ccb` copies it directly — no menu.

## How it works

1. Finds the most recently modified session JSONL in `~/.claude/projects/`
2. Parses the last assistant message
3. Extracts fenced code blocks
4. Copies your selection to clipboard (`clip.exe` / `pbcopy` / `xclip`)

No Claude in the loop. No API calls. No permission prompts. Just reads files and copies text.

## Platform support

- **Windows** (clip.exe)
- **macOS** (pbcopy)
- **Linux** (xclip or xsel)

## License

MIT
