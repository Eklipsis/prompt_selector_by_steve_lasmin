# Prompt Selector by Steve Lasmin

A ComfyUI custom node for browsing, editing, and outputting prompt text from `.txt` files — **without ever overwriting your originals**.

---

## Features

- **📂 File Browser** — Scans a folder for `.txt` files and shows them in a scrollable pop-up with a live filter/search box.
- **✏️ Non-Destructive Editing** — Load any file, edit the text freely. Originals stay untouched.
- **💾 Save As** — Write your edited text to a **new** `.txt` file. Blocked if the name already exists.
- **🔍 Quick Filter** — Type in the browser to instantly filter long prompt libraries.
- **🔄 Refresh** — Rescan the folder on demand or on page reload.

---

## Installation

### Method 1: ComfyUI Manager (Comfy Registry)
Search for **"Prompt Selector by Steve Lasmin"** in the ComfyUI Manager and install directly.

### Method 2: Git Clone
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Eklipsis/comfyui-prompt-selector.git
Restart ComfyUI.

### Method 3: Manual
1. Download the latest release ZIP.
2. Extract it into `ComfyUI/custom_nodes/`.
3. Restart ComfyUI.

---

## Usage

1. Add the node: **Steve Lasmin → Prompt Selector by Steve Lasmin**
2. Set **folder_path** to your prompt folder:
   - Absolute: `X:/MyPrompts` or `X:\MyPrompts`
   - Relative to ComfyUI root: `models/LLM/prompts` (default, but needs full path)
3. Click **📂 Select Prompt** to open the file browser.
4. Pick a file — its text loads into **prompt_text**.
5. Edit the text as needed.
6. Run the workflow — the current text is output as **STRING**.
7. Click **💾 Save As New File** to save a copy with a new name.

> **Tip:** Click the **?** button on the node for in-app help.

---

## Node Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `folder_path` | STRING | `models/LLM/prompts` | Folder to scan for `.txt` files. Absolute or relative to ComfyUI root. |
| `prompt_text` | STRING | *(empty)* | Editable prompt text. This is what gets sent to the output. |

## Node Outputs

| Output | Type | Description |
|--------|------|-------------|
| `prompt` | STRING | The current content of `prompt_text`. |

---

## File Structure

```
ComfyUI/custom_nodes/prompt_selector_by_steve_lasmin/
├── __init__.py
├── prompt_selector.py
├── js/
│   └── prompt_selector.js
├── pyproject.toml
├── README.md
└── LICENSE
```

---

## Credits

**Steve Lasmin**
- Boosty: [boosty.to/stevelasmin](https://boosty.to/stevelasmin)
- Email: real.eclipse@gmail.com

---

## License

MIT License — see [LICENSE](LICENSE) for details.
