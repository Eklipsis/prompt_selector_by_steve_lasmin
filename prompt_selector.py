"""Prompt Selector by Steve Lasmin

A ComfyUI node that scans a folder for .txt files, lets you pick one via a
scrollable pop-up, edit the text in-place, and output it as STRING.
Original files are never modified. A "Save As" feature writes new files.

Credits: Steve Lasmin | https://boosty.to/stevelasmin | real.eclipse@gmail.com
"""
import os
from aiohttp import web

NODE_DIR = os.path.dirname(os.path.abspath(__file__))
COMFYUI_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(NODE_DIR)))


def resolve_folder(folder):
    """Resolve folder path. Absolute paths are used as-is;
    relative paths are resolved against ComfyUI root."""
    folder = folder.strip()
    if not folder:
        folder = "models/LLM/prompts"
    if os.path.isabs(folder):
        return os.path.normpath(folder)
    return os.path.normpath(os.path.join(COMFYUI_ROOT, folder))


# ═══════════════════════════════════════════════════════════
#  API Routes
# ═══════════════════════════════════════════════════════════
try:
    from server import PromptServer

    @PromptServer.instance.routes.get("/stevelasmin/prompt_selector/list")
    async def api_list_files(request):
        """Return sorted list of .txt files in the given folder."""
        try:
            folder = request.query.get("folder", "models/LLM/prompts")
            path = resolve_folder(folder)

            if not os.path.isdir(path):
                return web.json_response({"files": [], "error": f"Folder not found: {folder}"})

            files = [f for f in os.listdir(path)
                     if os.path.isfile(os.path.join(path, f)) and f.lower().endswith(".txt")]
            files.sort()
            return web.json_response({"files": files})
        except Exception as e:
            return web.json_response({"files": [], "error": str(e)})

    @PromptServer.instance.routes.get("/stevelasmin/prompt_selector/load")
    async def api_load_file(request):
        """Load the contents of a single .txt file."""
        try:
            folder = request.query.get("folder", "models/LLM/prompts")
            filename = request.query.get("file", "")
            path = resolve_folder(folder)
            filepath = os.path.join(path, os.path.basename(filename))

            if not os.path.isfile(filepath):
                return web.json_response({"content": "", "error": "File not found"})

            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            return web.json_response({"content": content})
        except Exception as e:
            return web.json_response({"content": "", "error": str(e)})

    @PromptServer.instance.routes.post("/stevelasmin/prompt_selector/save")
    async def api_save_file(request):
        """Save a new .txt file. Fails if the file already exists."""
        try:
            data = await request.json()
            folder = data.get("folder", "models/LLM/prompts")
            filename = data.get("filename", "")
            content = data.get("content", "")

            path = resolve_folder(folder)
            os.makedirs(path, exist_ok=True)

            filename = os.path.basename(filename)
            if not filename.lower().endswith(".txt"):
                filename += ".txt"

            filepath = os.path.join(path, filename)
            if os.path.exists(filepath):
                return web.json_response({"success": False, "error": f"'{filename}' already exists"})

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)

            return web.json_response({"success": True, "filepath": filepath})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})

except ImportError:
    pass


# ═══════════════════════════════════════════════════════════
#  Node Class
# ═══════════════════════════════════════════════════════════
class PromptSelector:
    """
    Browse a folder of .txt prompt files, pick one, edit it, and output the text.
    Original files are read-only. Use "Save As" to write new files.
    """

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "folder_path": ("STRING", {
                    "default": "models/LLM/prompts",
                    "multiline": False,
                    "tooltip": "Absolute path (X:/folder) or relative to ComfyUI root. Default: models/LLM/prompts"
                }),
                "prompt_text": ("STRING", {
                    "default": "",
                    "multiline": True,
                    "tooltip": "Editable prompt text. This is what gets sent to the STRING output."
                }),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("prompt",)
    FUNCTION = "get_prompt"
    CATEGORY = "Steve Lasmin"
    DESCRIPTION = "Browse .txt prompt files, edit, and output as STRING."

    def get_prompt(self, folder_path, prompt_text):
        """Pass the current prompt_text through to the output."""
        return (prompt_text,)
