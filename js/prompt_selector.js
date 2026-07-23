import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "SteveLasmin.PromptSelector",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "PromptSelector") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

            const folderWidget = this.widgets.find(w => w.name === "folder_path");
            const promptWidget = this.widgets.find(w => w.name === "prompt_text");

            // ── State ──────────────────────────────────────────────
            let filesData = [];
            let activeFilename = "";

            const updatePrompt = (text) => {
                if (!promptWidget) return;
                promptWidget.value = text;
                if (promptWidget.inputEl) promptWidget.inputEl.value = text;
                if (promptWidget.callback) promptWidget.callback(text);
            };

            // ═══════════════════════════════════════════════════════
            //  Node UI
            // ═══════════════════════════════════════════════════════
            const container = document.createElement("div");
            container.style.cssText = "display:flex;flex-direction:column;gap:5px;padding:2px;";

            // Row: Select + Refresh + Help
            const row1 = document.createElement("div");
            row1.style.cssText = "display:flex;gap:4px;align-items:center;";

            const selectBtn = document.createElement("button");
            selectBtn.textContent = "📂 Select Prompt";
            selectBtn.title = "Open the file browser";
            selectBtn.style.cssText = "font-size:11px;padding:3px 10px;cursor:pointer;flex:1;background:#2a2a4a;border:1px solid #4a4a7a;color:#dde;border-radius:3px;";
            selectBtn.onmouseenter = () => selectBtn.style.background = "#3a3a5a";
            selectBtn.onmouseleave = () => selectBtn.style.background = "#2a2a4a";

            const refreshBtn = document.createElement("button");
            refreshBtn.textContent = "🔄";
            refreshBtn.title = "Refresh file list from the folder";
            refreshBtn.style.cssText = "font-size:11px;padding:3px 8px;cursor:pointer;background:#2a2a3a;border:1px solid #4a4a6a;color:#ccd;border-radius:3px;";
            refreshBtn.onmouseenter = () => refreshBtn.style.background = "#3a3a5a";
            refreshBtn.onmouseleave = () => refreshBtn.style.background = "#2a2a3a";

            const helpBtn = document.createElement("button");
            helpBtn.textContent = "?";
            helpBtn.title = "Show help";
            helpBtn.style.cssText = "font-size:11px;padding:3px 8px;cursor:pointer;background:#2a2a3a;border:1px solid #4a4a6a;color:#ccd;border-radius:3px;font-weight:bold;";
            helpBtn.onmouseenter = () => helpBtn.style.background = "#3a3a5a";
            helpBtn.onmouseleave = () => helpBtn.style.background = "#2a2a3a";

            row1.appendChild(selectBtn);
            row1.appendChild(refreshBtn);
            row1.appendChild(helpBtn);
            container.appendChild(row1);

            // ═══════════════════════════════════════════════════════
            //  PROMINENT: Selected filename banner
            // ═══════════════════════════════════════════════════════
            const fileBanner = document.createElement("div");
            fileBanner.style.cssText = `
                background: linear-gradient(135deg, #1a1a3a 0%, #2a2a4a 100%);
                border: 1px solid #4a4a7a;
                border-radius: 4px;
                padding: 6px 10px;
                text-align: center;
                min-height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            const fileIcon = document.createElement("span");
            fileIcon.textContent = "📄 ";
            fileIcon.style.cssText = "font-size:12px;margin-right:4px;";

            const fileNameText = document.createElement("span");
            fileNameText.textContent = "No file selected";
            fileNameText.style.cssText = "font-size:12px;font-weight:600;color:#ccd;letter-spacing:0.3px;";

            const fileExt = document.createElement("span");
            fileExt.textContent = "";
            fileExt.style.cssText = "font-size:10px;color:#888;margin-left:2px;";

            fileBanner.appendChild(fileIcon);
            fileBanner.appendChild(fileNameText);
            fileBanner.appendChild(fileExt);
            container.appendChild(fileBanner);

            // Sub-label: file count / status
            const statusLabel = document.createElement("div");
            statusLabel.textContent = "0 files in folder";
            statusLabel.style.cssText = "font-size:9px;color:#666;text-align:center;padding:0 2px;";
            container.appendChild(statusLabel);

            // Save As
            const saveBtn = document.createElement("button");
            saveBtn.textContent = "💾 Save As New File";
            saveBtn.title = "Save the current text as a new .txt file (never overwrites originals)";
            saveBtn.style.cssText = "font-size:11px;padding:4px 8px;cursor:pointer;background:#1a3a1a;border:1px solid #3a6a3a;color:#afa;border-radius:3px;";
            saveBtn.onmouseenter = () => saveBtn.style.background = "#2a4a2a";
            saveBtn.onmouseleave = () => saveBtn.style.background = "#1a3a1a";
            container.appendChild(saveBtn);

            this.addDOMWidget("prompt_selector_ui", "custom", container, {
                serialize: false,
                hideOnZoom: false
            });

            // ═══════════════════════════════════════════════════════
            //  File Browser Modal
            // ═══════════════════════════════════════════════════════
            const modal = document.createElement("div");
            modal.style.cssText = `
                display:none;position:fixed;top:0;left:0;width:100%;height:100%;
                background:rgba(0,0,0,0.7);z-index:9999;justify-content:center;align-items:center;
            `;

            const modalBox = document.createElement("div");
            modalBox.style.cssText = `
                background:#1a1a2e;border:1px solid #4a4a6a;border-radius:6px;
                width:380px;max-width:90vw;max-height:80vh;display:flex;flex-direction:column;
                box-shadow:0 8px 32px rgba(0,0,0,0.5);
            `;

            const modalHeader = document.createElement("div");
            modalHeader.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #2a2a4a;";

            const modalTitle = document.createElement("span");
            modalTitle.textContent = "Select a Prompt File";
            modalTitle.style.cssText = "font-size:13px;font-weight:bold;color:#ccd;";

            const closeBtn = document.createElement("button");
            closeBtn.textContent = "✕";
            closeBtn.title = "Close";
            closeBtn.style.cssText = "font-size:14px;padding:0 6px;cursor:pointer;background:transparent;border:none;color:#888;";
            closeBtn.onmouseenter = () => closeBtn.style.color = "#e44";
            closeBtn.onmouseleave = () => closeBtn.style.color = "#888";

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeBtn);
            modalBox.appendChild(modalHeader);

            const searchBox = document.createElement("input");
            searchBox.type = "text";
            searchBox.placeholder = "Filter files...";
            searchBox.title = "Type to filter the file list";
            searchBox.style.cssText = `
                margin:8px 14px 0;padding:5px 8px;font-size:11px;
                background:#111122;border:1px solid #3a3a5a;border-radius:3px;color:#ccd;outline:none;
            `;
            modalBox.appendChild(searchBox);

            const fileList = document.createElement("div");
            fileList.style.cssText = `
                margin:8px 14px 14px;padding:4px;overflow-y:auto;max-height:50vh;
                background:#111122;border:1px solid #2a2a3a;border-radius:3px;
            `;
            modalBox.appendChild(fileList);

            const countLabel = document.createElement("div");
            countLabel.textContent = "0 files";
            countLabel.style.cssText = "font-size:10px;color:#666;padding:0 14px 10px;text-align:right;";
            modalBox.appendChild(countLabel);

            modal.appendChild(modalBox);
            document.body.appendChild(modal);

            // ── Modal Logic ────────────────────────────────────────
            const openModal = () => {
                modal.style.display = "flex";
                searchBox.value = "";
                searchBox.focus();
                renderList(filesData);
            };

            const closeModal = () => { modal.style.display = "none"; };

            selectBtn.onclick = openModal;
            closeBtn.onclick = closeModal;
            modal.onclick = (e) => { if (e.target === modal) closeModal(); };

            const renderList = (files) => {
                fileList.innerHTML = "";
                countLabel.textContent = `${files.length} file${files.length !== 1 ? "s" : ""}`;

                if (!files.length) {
                    const empty = document.createElement("div");
                    empty.textContent = "No .txt files found";
                    empty.style.cssText = "color:#666;font-size:11px;padding:8px;text-align:center;font-style:italic;";
                    fileList.appendChild(empty);
                    return;
                }

                files.forEach(filename => {
                    const item = document.createElement("div");
                    const isActive = filename === activeFilename;
                    item.textContent = filename.replace(/\.txt$/i, "");
                    item.style.cssText = `
                        padding:6px 10px;font-size:12px;cursor:pointer;border-radius:3px;
                        color:${isActive ? "#aaf" : "#bbc"};
                        background:${isActive ? "#2a2a4a" : "transparent"};
                        border-left:3px solid ${isActive ? "#66a" : "transparent"};
                    `;
                    item.onmouseenter = () => { if (filename !== activeFilename) item.style.background = "#222236"; };
                    item.onmouseleave = () => { if (filename !== activeFilename) item.style.background = "transparent"; };

                    item.onclick = async () => {
                        activeFilename = filename;
                        closeModal();

                        // Update prominent banner
                        const baseName = filename.replace(/\.txt$/i, "");
                        fileNameText.textContent = baseName;
                        fileExt.textContent = ".txt";
                        fileBanner.style.borderColor = "#5a5a9a";
                        fileBanner.style.background = "linear-gradient(135deg, #1a1a3a 0%, #3a3a5a 100%)";
                        fileNameText.style.color = "#ddf";

                        const folder = folderWidget?.value?.trim() || "models/LLM/prompts";
                        try {
                            const r = await fetch(`/stevelasmin/prompt_selector/load?folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(filename)}`);
                            const fileData = await r.json();
                            if (fileData.error) {
                                alert("Error: " + fileData.error);
                                return;
                            }
                            updatePrompt(fileData.content);
                        } catch (e) {
                            console.error("Load failed:", e);
                            alert("Failed to load file");
                        }
                    };

                    fileList.appendChild(item);
                });
            };

            searchBox.oninput = () => {
                const q = searchBox.value.toLowerCase();
                const filtered = filesData.filter(f => f.toLowerCase().includes(q));
                renderList(filtered);
            };

            // ═══════════════════════════════════════════════════════
            //  Help Modal
            // ═══════════════════════════════════════════════════════
            const helpModal = document.createElement("div");
            helpModal.style.cssText = `
                display:none;position:fixed;top:0;left:0;width:100%;height:100%;
                background:rgba(0,0,0,0.7);z-index:10000;justify-content:center;align-items:center;
            `;

            const helpBox = document.createElement("div");
            helpBox.style.cssText = `
                background:#1a1a2e;border:1px solid #4a4a6a;border-radius:6px;
                width:420px;max-width:90vw;max-height:80vh;display:flex;flex-direction:column;
                box-shadow:0 8px 32px rgba(0,0,0,0.5);overflow:hidden;
            `;

            const helpHeader = document.createElement("div");
            helpHeader.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #2a2a4a;";

            const helpTitle = document.createElement("span");
            helpTitle.textContent = "Prompt Selector — Help";
            helpTitle.style.cssText = "font-size:13px;font-weight:bold;color:#ccd;";

            const helpClose = document.createElement("button");
            helpClose.textContent = "✕";
            helpClose.title = "Close";
            helpClose.style.cssText = "font-size:14px;padding:0 6px;cursor:pointer;background:transparent;border:none;color:#888;";
            helpClose.onmouseenter = () => helpClose.style.color = "#e44";
            helpClose.onmouseleave = () => helpClose.style.color = "#888";

            helpHeader.appendChild(helpTitle);
            helpHeader.appendChild(helpClose);
            helpBox.appendChild(helpHeader);

            const helpBody = document.createElement("div");
            helpBody.style.cssText = "padding:14px;font-size:12px;color:#bbc;line-height:1.6;overflow-y:auto;max-height:60vh;";
            helpBody.innerHTML = `
                <p style="margin:0 0 8px 0;font-weight:bold;color:#dde;">Quick Start</p>
                <ol style="margin:0 0 12px 16px;padding:0;">
                    <li>Set <b>folder_path</b> to the folder containing your <code>.txt</code> prompt files.<br>
                        Use absolute paths (<code>X:/folder</code>) or relative to ComfyUI root.<br>
                        Default: <code>models/LLM/prompts</code></li>
                    <li>Click <b>📂 Select Prompt</b> to open the file browser.</li>
                    <li>Pick a file — its name appears in the banner and text loads into <b>prompt_text</b>.</li>
                    <li>Edit the text freely. Your edits <b>do not</b> touch the original file.</li>
                    <li>Run the workflow — the current text is sent to the <b>STRING</b> output.</li>
                </ol>

                <p style="margin:0 0 8px 0;font-weight:bold;color:#dde;">Save As</p>
                <p style="margin:0 0 12px 0;">
                    Click <b>💾 Save As New File</b> to write the current text to a <b>new</b>
                    <code>.txt</code> file in the same folder. You will be asked for a filename.
                    If the name already exists, the save is blocked to protect your files.
                </p>

                <p style="margin:0 0 8px 0;font-weight:bold;color:#dde;">Tips</p>
                <ul style="margin:0 0 12px 16px;padding:0;">
                    <li>The selected filename is shown in the banner on the node.</li>
                    <li>Use the filter box in the file browser to quickly find prompts.</li>
                    <li>Click 🔄 to rescan the folder after adding new files.</li>
                    <li>Only <code>.txt</code> files are shown (flat scan, no subfolders).</li>
                </ul>

                <p style="margin:0 0 8px 0;font-weight:bold;color:#dde;">Credits</p>
                <p style="margin:0;">
                    Created by <b>Steve Lasmin</b><br>
                    <a href="https://boosty.to/stevelasmin" target="_blank" style="color:#8af;">boosty.to/stevelasmin</a><br>
                    <span style="color:#888;">real.eclipse@gmail.com</span>
                </p>
            `;
            helpBox.appendChild(helpBody);

            helpModal.appendChild(helpBox);
            document.body.appendChild(helpModal);

            const openHelp = () => { helpModal.style.display = "flex"; };
            const closeHelp = () => { helpModal.style.display = "none"; };

            helpBtn.onclick = openHelp;
            helpClose.onclick = closeHelp;
            helpModal.onclick = (e) => { if (e.target === helpModal) closeHelp(); };

            // ═══════════════════════════════════════════════════════
            //  Load / Save Logic
            // ═══════════════════════════════════════════════════════
            const loadFiles = async () => {
                const folder = folderWidget?.value?.trim() || "models/LLM/prompts";
                try {
                    const resp = await fetch(`/stevelasmin/prompt_selector/list?folder=${encodeURIComponent(folder)}`);
                    const data = await resp.json();

                    if (data.error) {
                        filesData = [];
                        fileNameText.textContent = "Folder not found";
                        fileExt.textContent = "";
                        fileNameText.style.color = "#e44";
                        fileBanner.style.borderColor = "#633";
                        statusLabel.textContent = data.error;
                        statusLabel.style.color = "#e44";
                        return;
                    }

                    filesData = data.files || [];
                    statusLabel.textContent = `${filesData.length} file${filesData.length !== 1 ? "s" : ""} in folder`;
                    statusLabel.style.color = "#666";

                    if (!filesData.length) {
                        fileNameText.textContent = "No .txt files";
                        fileExt.textContent = "";
                        fileNameText.style.color = "#888";
                        fileBanner.style.borderColor = "#3a3a5a";
                        fileBanner.style.background = "linear-gradient(135deg, #1a1a2a 0%, #2a2a3a 100%)";
                        activeFilename = "";
                        return;
                    }

                    if (activeFilename && filesData.includes(activeFilename)) {
                        const baseName = activeFilename.replace(/\.txt$/i, "");
                        fileNameText.textContent = baseName;
                        fileExt.textContent = ".txt";
                        fileNameText.style.color = "#ddf";
                        fileBanner.style.borderColor = "#5a5a9a";
                        fileBanner.style.background = "linear-gradient(135deg, #1a1a3a 0%, #3a3a5a 100%)";
                    } else {
                        fileNameText.textContent = `${filesData.length} files available`;
                        fileExt.textContent = "";
                        fileNameText.style.color = "#888";
                        fileBanner.style.borderColor = "#3a3a5a";
                        fileBanner.style.background = "linear-gradient(135deg, #1a1a2a 0%, #2a2a3a 100%)";
                        activeFilename = "";
                    }
                } catch (e) {
                    console.error("List failed:", e);
                    filesData = [];
                    fileNameText.textContent = "Load error";
                    fileExt.textContent = "";
                    fileNameText.style.color = "#e44";
                    fileBanner.style.borderColor = "#633";
                    statusLabel.textContent = "Failed to load file list";
                    statusLabel.style.color = "#e44";
                }
            };

            refreshBtn.onclick = loadFiles;

            saveBtn.onclick = async () => {
                const content = promptWidget?.value || "";
                if (!content.trim()) {
                    alert("Nothing to save — text is empty.");
                    return;
                }
                let filename = prompt("Enter new filename (without .txt extension):");
                if (!filename?.trim()) return;
                filename = filename.trim();

                const folder = folderWidget?.value?.trim() || "models/LLM/prompts";
                try {
                    const resp = await fetch("/stevelasmin/prompt_selector/save", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ folder, filename, content })
                    });
                    const data = await resp.json();
                    if (data.success) {
                        alert(`Saved as ${filename}.txt`);
                        await loadFiles();
                        activeFilename = filename + ".txt";
                        const baseName = activeFilename.replace(/\.txt$/i, "");
                        fileNameText.textContent = baseName;
                        fileExt.textContent = ".txt";
                        fileNameText.style.color = "#ddf";
                        fileBanner.style.borderColor = "#5a5a9a";
                        fileBanner.style.background = "linear-gradient(135deg, #1a1a3a 0%, #3a3a5a 100%)";
                    } else {
                        alert("Save failed: " + (data.error || "Unknown error"));
                    }
                } catch (e) {
                    console.error("Save error:", e);
                    alert("Failed to save file");
                }
            };

            // ── Init ───────────────────────────────────────────────
            setTimeout(loadFiles, 50);

            if (folderWidget) {
                const orig = folderWidget.callback;
                folderWidget.callback = function (v) {
                    if (orig) orig.apply(this, arguments);
                    activeFilename = "";
                    loadFiles();
                };
            }

            // Cleanup modals on node removal
            const onRemoved = this.onRemoved;
            this.onRemoved = function () {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
                if (helpModal.parentNode) helpModal.parentNode.removeChild(helpModal);
                if (onRemoved) onRemoved.apply(this, arguments);
            };

            return result;
        };
    }
});
