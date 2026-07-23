"""Prompt Selector by Steve Lasmin — ComfyUI custom node.

Browse, edit, and output prompt text from .txt files without overwriting originals.
"""
from .prompt_selector import PromptSelector

NODE_CLASS_MAPPINGS = {
    "PromptSelector": PromptSelector,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PromptSelector": "Prompt Selector by Steve Lasmin",
}

WEB_DIRECTORY = "./js"
