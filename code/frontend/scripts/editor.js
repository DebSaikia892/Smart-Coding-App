// Code editor functionality
let editor;
let fileContents = {}; // Cache for file contents

function initializeEditor() {
    // Initialize CodeMirror editor
    const codeArea = document.getElementById('code-area');
    
    editor = CodeMirror.fromTextArea(codeArea, {
        mode: 'python',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        autoCloseBrackets: true,
        matchBrackets: true,
        lineWrapping: true,
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Tab': (cm) => {
                if (cm.somethingSelected()) {
                    cm.indentSelection('add');
                } else {
                    cm.replaceSelection('    ');
                }
            },
            'Ctrl-/': (cm) => {
                toggleComment(cm);
            },
            'Ctrl-S': (cm) => {
                saveCurrentFile();
                showNotification('File saved', 'success');
                return false;
            }
        }
    });
    
    // Set initial content
    editor.setValue('# Welcome to AI Voice Pair Programmer\n# Try asking me to create a function or explain a concept\n\ndef hello_world():\n    print("Hello, World!")\n\n# Run the function\nhello_world()');
    
    // Set up auto-save
    editor.on('change', debounce(autoSaveCode, 1000));
    
    // Set up file tabs
    setupFileTabs();
    
    // Set up editor context menu
    setupEditorContextMenu();
    
    // Apply stored font size
    const fontSize = localStorage.getItem('font_size') || '14';
    document.querySelector('.CodeMirror').style.fontSize = `${fontSize}px`;
    
    // Initialize error markers
    initializeErrorMarkers();
}

function getCurrentLanguage() {
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab) return 'python';
    
    const filename = activeTab.textContent;
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
        case 'py':
            return 'python';
        case 'js':
            return 'javascript';
        case 'html':
            return 'html';
        case 'css':
            return 'css';
        case 'java':
            return 'java';
        case 'cpp':
        case 'c':
            return 'cpp';
        case 'json':
            return 'javascript';
        case 'md':
            return 'markdown';
        default:
            return 'python';
    }
}

function setupFileTabs() {
    const tabs = document.querySelectorAll('.tab');
    const fileList = document.querySelectorAll('#file-list li');
    
    // Set up editor tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Save current file
            saveCurrentFile();
            
            // Update active tab
            document.querySelector('.tab.active')?.classList.remove('active');
            tab.classList.add('active');
            
            // Update file list selection
            const filename = tab.textContent;
            document.querySelector('#file-list li.active')?.classList.remove('active');
            Array.from(document.querySelectorAll('#file-list li')).forEach(li => {
                if (li.textContent === filename) {
                    li.classList.add('active');
                }
            });
            
            // Load file content
            loadFile(filename);
            
            // Update editor mode based on file extension
            updateEditorMode(filename);
        });
        
        // Add close button to tab
        const closeBtn = document.createElement('span');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeFile(tab.textContent);
        });
        tab.appendChild(closeBtn);
    });
    
    // Set up file list
    fileList.forEach(file => {
        file.addEventListener('click', () => {
            // Save current file
            saveCurrentFile();
            
            // Update active file
            document.querySelector('#file-list li.active')?.classList.remove('active');
            file.classList.add('active');
            
            // Update tab selection
            const filename = file.textContent;
            document.querySelector('.tab.active')?.classList.remove('active');
            
            // Find or create tab
            let tab = Array.from(document.querySelectorAll('.tab')).find(t => 
                t.textContent.replace('×', '').trim() === filename
            );
            
            if (!tab) {
                // Create new tab if it doesn't exist
                tab = createNewTab(filename);
            }
            
            tab.classList.add('active');
            
            // Load file content
            loadFile(filename);
            
            // Update editor mode based on file extension
            updateEditorMode(filename);
        });
        
        // Add context menu to file list items
        file.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showFileContextMenu(e, file.textContent);
        });
    });
    
    // Set up new file button
    document.getElementById('new-file-btn').addEventListener('click', createNewFile);
}

function createNewTab(filename) {
    const tabsContainer = document.querySelector('.editor-tabs');
    const newTab = document.createElement('div');
    newTab.className = 'tab';
    newTab.textContent = filename;
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'tab-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeFile(filename);
    });
    newTab.appendChild(closeBtn);
    
    // Add click handler
    newTab.addEventListener('click', () => {
        saveCurrentFile();
        document.querySelector('.tab.active')?.classList.remove('active');
        newTab.classList.add('active');
        
        document.querySelector('#file-list li.active')?.classList.remove('active');
        Array.from(document.querySelectorAll('#file-list li')).forEach(li => {
            if (li.textContent === filename) {
                li.classList.add('active');
            }
        });
        
        loadFile(filename);
        updateEditorMode(filename);
    });
    
    tabsContainer.appendChild(newTab);
    return newTab;
}

function updateEditorMode(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
        case 'py':
            editor.setOption('mode', 'python');
            break;
        case 'js':
            editor.setOption('mode', 'javascript');
            break;
        case 'html':
            editor.setOption('mode', 'htmlmixed');
            break;
        case 'css':
            editor.setOption('mode', 'css');
            break;
        case 'java':
            editor.setOption('mode', 'clike');
            break;
        case 'cpp':
        case 'c':
            editor.setOption('mode', 'clike');
            break;
        case 'json':
            editor.setOption('mode', 'javascript');
            break;
        case 'md':
            editor.setOption('mode', 'markdown');
            break;
        default:
            editor.setOption('mode', 'python');
    }
}

function saveCurrentFile() {
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab) return;
    
    const filename = activeTab.textContent.replace('×', '').trim();
    const content = editor.getValue();
    
    // Save to cache
    fileContents[filename] = content;
    
    // Save to localStorage
    localStorage.setItem(`file_${filename}`, content);
    
    // If we have a project ID, save to server
    const projectId = localStorage.getItem('current_project_id');
    if (projectId) {
        saveFileToServer(projectId, filename, content);
    }
}

function saveFileToServer(projectId, filename, content) {
    fetch('/api/save_file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            project_id: projectId,
            filename: filename,
            content: content,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'success') {
            console.error('Error saving file to server:', data.error);
        }
    })
    .catch(error => {
        console.error('Error saving file to server:', error);
    });
}

function loadFile(filename) {
    // First check cache
    if (fileContents[filename]) {
        editor.setValue(fileContents[filename]);
        return;
    }
    
    // Then try localStorage
    const content = localStorage.getItem(`file_${filename}`);
    
    if (content) {
        editor.setValue(content);
        fileContents[filename] = content;
    } else {
        // Try to load from server if we have a project ID
        const projectId = localStorage.getItem('current_project_id');
        if (projectId) {
            loadFileFromServer(projectId, filename);
        } else {
            // Default content based on file type
            createDefaultContent(filename);
        }
    }
}

function loadFileFromServer(projectId, filename) {
    fetch(`/api/get_file?project_id=${projectId}&filename=${filename}&user_id=${localStorage.getItem('user_id')}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.content) {
                editor.setValue(data.content);
                fileContents[filename] = data.content;
                localStorage.setItem(`file_${filename}`, data.content);
            } else {
                createDefaultContent(filename);
            }
        })
        .catch(error => {
            console.error('Error loading file from server:', error);
            createDefaultContent(filename);
        });
}

function createDefaultContent(filename) {
    // Default content based on file type
    let defaultContent = '';
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
        case 'py':
            defaultContent = '# New Python file\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()';
            break;
        case 'js':
            defaultContent = '// New JavaScript file\n\nfunction main() {\n    console.log("Hello, World!");\n}\n\nmain();';
            break;
        case 'html':
            defaultContent = '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>';
            break;
        case 'css':
            defaultContent = '/* New CSS file */\n\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background-color: #f5f5f5;\n}';
            break;
        case 'json':
            defaultContent = '{\n    "name": "project",\n    "version": "1.0.0",\n    "description": "A new project"\n}';
            break;
        case 'md':
            defaultContent = '# New Document\n\n## Introduction\n\nWrite your content here.';
            break;
        default:
            defaultContent = `# New file: ${filename}`;
    }
    
    editor.setValue(defaultContent);
    fileContents[filename] = defaultContent;
    localStorage.setItem(`file_${filename}`, defaultContent);
}

function createNewFile() {
    const filename = prompt('Enter file name (with extension):');
    
    if (!filename || filename.trim() === '') return;
    
    // Check if file already exists
    const existingFile = document.querySelector(`#file-list li:contains('${filename}')`);
    if (existingFile) {
        alert('A file with this name already exists.');
        return;
    }
    
    // Create new file in file list
    const fileList = document.getElementById('file-list');
    const newFile = document.createElement('li');
    newFile.textContent = filename;
    fileList.appendChild(newFile);
    
    // Add click handler to file
    newFile.addEventListener('click', () => {
        saveCurrentFile();
        document.querySelector('#file-list li.active')?.classList.remove('active');
        newFile.classList.add('active');
        
        // Find or create tab
        let tab = Array.from(document.querySelectorAll('.tab')).find(t => 
            t.textContent.replace('×', '').trim() === filename
        );
        
        if (!tab) {
            tab = createNewTab(filename);
        }
        
        document.querySelector('.tab.active')?.classList.remove('active');
        tab.classList.add('active');
        
        loadFile(filename);
        updateEditorMode(filename);
    });
    
    // Add context menu
    newFile.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showFileContextMenu(e, filename);
    });
    
    // Create new tab
    const newTab = createNewTab(filename);
    
    // Switch to the new file
    document.querySelector('.tab.active')?.classList.remove('active');
    newTab.classList.add('active');
    document.querySelector('#file-list li.active')?.classList.remove('active');
    newFile.classList.add('active');
    
    // Create default content
    createDefaultContent(filename);
    updateEditorMode(filename);
}

function closeFile(filename) {
    // Remove tab
    const tabs = document.querySelectorAll('.tab');
    let tabToRemove = null;
    let isActiveTab = false;
    
    for (const tab of tabs) {
        if (tab.textContent.replace('×', '').trim() === filename) {
            tabToRemove = tab;
            isActiveTab = tab.classList.contains('active');
            break;
        }
    }
    
    if (tabToRemove) {
        // Save file before closing
        if (isActiveTab) {
            saveCurrentFile();
        }
        
        // Remove the tab
        tabToRemove.remove();
        
        // If it was the active tab, activate another tab
        if (isActiveTab && tabs.length > 1) {
            const remainingTabs = document.querySelectorAll('.tab');
            if (remainingTabs.length > 0) {
                remainingTabs[0].click();
            }
        }
    }
}

function autoSaveCode() {
    // Save current file
    saveCurrentFile();
    
    // Analyze code for suggestions
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab) return;
    
    const filename = activeTab.textContent.replace('×', '').trim();
    const language = getCurrentLanguage();
    const code = editor.getValue();
    
    // Only analyze if code has changed
    const cachedCode = localStorage.getItem(`last_analyzed_${filename}`);
    if (cachedCode === code) return;
    
    localStorage.setItem(`last_analyzed_${filename}`, code);
    
    fetch('/api/analyze_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            language: language,
            filename: filename,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        // Handle code analysis results
        if (data.analysis && data.analysis.issues) {
            displayCodeIssues(data.analysis.issues);
        }
    })
    .catch(error => {
        console.error('Error analyzing code:', error);
    });
}

// Error markers
let errorMarkers = [];

function initializeErrorMarkers() {
    // Clear any existing markers when editor is initialized
    errorMarkers.forEach(marker => marker.clear());
    errorMarkers = [];
}

function displayCodeIssues(issues) {
    // Clear previous markers
    errorMarkers.forEach(marker => marker.clear());
    errorMarkers = [];
    
    // Add new markers for each issue
    issues.forEach(issue => {
        if (issue.line !== undefined) {
            const marker = editor.markText(
                {line: issue.line - 1, ch: 0},
                {line: issue.line - 1, ch: 100},
                {
                    className: 'code-issue',
                    title: issue.message
                }
            );
            errorMarkers.push(marker);
        }
    });
}

// Editor context menu (continued)
function setupEditorContextMenu() {
    editor.getWrapperElement().addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;
        
        const menuItems = [
            { label: 'Cut', action: () => { document.execCommand('cut'); } },
            { label: 'Copy', action: () => { document.execCommand('copy'); } },
            { label: 'Paste', action: () => { document.execCommand('paste'); } },
            { label: 'Select All', action: () => { editor.execCommand('selectAll'); } },
            { label: '---', action: null }, // Separator
            { label: 'Format Code', action: formatCode },
            { label: 'Comment/Uncomment', action: () => toggleComment(editor) },
            { label: '---', action: null }, // Separator
            { label: 'Ask AI to Explain', action: explainCodeSelection },
            { label: 'Ask AI to Improve', action: improveCodeSelection }
        ];
        
        menuItems.forEach(item => {
            if (item.label === '---') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                contextMenu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                menuItem.textContent = item.label;
                menuItem.addEventListener('click', () => {
                    item.action();
                    document.body.removeChild(contextMenu);
                });
                contextMenu.appendChild(menuItem);
            }
        });
        
        document.body.appendChild(contextMenu);
        
        // Remove menu when clicking elsewhere
        const removeMenu = () => {
            if (document.body.contains(contextMenu)) {
                document.body.removeChild(contextMenu);
            }
            document.removeEventListener('click', removeMenu);
        };
        
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
        }, 100);
    });
}

// Add this function after setupEditorContextMenu() is defined
function setupEditorContextMenu() {
    const menu = document.createElement('div');
    menu.className = 'editor-context-menu';
    document.body.appendChild(menu);
    
    editor.getWrapperElement().addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        // Get cursor position
        const cursor = editor.getCursor();
        const selectedText = editor.getSelection();
        
        // Create menu items
        menu.innerHTML = `
            <div class="menu-item" id="cm-format">Format Code</div>
            <div class="menu-item" id="cm-explain">Explain Code</div>
            <div class="menu-item" id="cm-improve">Improve Code</div>
            <div class="menu-item" id="cm-analyze">Analyze Code</div>
            ${selectedText ? '<div class="menu-item" id="cm-explain-selection">Explain Selection</div>' : ''}
        `;
        
        // Position menu
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        menu.style.display = 'block';
        
        // Add event listeners
        document.getElementById('cm-format').addEventListener('click', formatCode);
        document.getElementById('cm-explain').addEventListener('click', explainCode);
        document.getElementById('cm-improve').addEventListener('click', improveCode);
        document.getElementById('cm-analyze').addEventListener('click', analyzeCode);
        
        if (selectedText) {
            document.getElementById('cm-explain-selection').addEventListener('click', () => {
                explainCodeSelection(selectedText);
            });
        }
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    });
}

// Add this function to explain selected code
function explainCodeSelection(selectedText) {
    const language = getCurrentLanguage();
    
    fetch('/api/explain_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: selectedText,
            language: language,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const explanation = marked.parse(data.explanation);
            showResults('Selection Explanation', explanation);
            // Add syntax highlighting to code blocks
            document.querySelectorAll('#results-content pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            showResults('Error', `<div class="error-message">❌ ${data.error || 'Unknown error'}</div>`);
        }
    })
    .catch(error => {
        console.error('Error explaining selection:', error);
        showResults('Error', '<div class="error-message">❌ Failed to explain selection</div>');
    });
}


// File context menu
function showFileContextMenu(e, filename) {
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.left = `${e.clientX}px`;
    
    const menuItems = [
        { label: 'Open', action: () => openFile(filename) },
        { label: 'Rename', action: () => renameFile(filename) },
        { label: 'Delete', action: () => deleteFile(filename) },
        { label: '---', action: null }, // Separator
        { label: 'Download', action: () => downloadFile(filename) }
    ];
    
    menuItems.forEach(item => {
        if (item.label === '---') {
            const separator = document.createElement('div');
            separator.className = 'context-menu-separator';
            contextMenu.appendChild(separator);
        } else {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.textContent = item.label;
            menuItem.addEventListener('click', () => {
                item.action();
                document.body.removeChild(contextMenu);
            });
            contextMenu.appendChild(menuItem);
        }
    });
    
    document.body.appendChild(contextMenu);
    
    // Remove menu when clicking elsewhere
    const removeMenu = () => {
        if (document.body.contains(contextMenu)) {
            document.body.removeChild(contextMenu);
        }
        document.removeEventListener('click', removeMenu);
    };
    
    setTimeout(() => {
        document.addEventListener('click', removeMenu);
    }, 100);
}

function openFile(filename) {
    // Find the file in the list and click it
    const fileList = document.querySelectorAll('#file-list li');
    for (const file of fileList) {
        if (file.textContent === filename) {
            file.click();
            break;
        }
    }
}

function renameFile(oldFilename) {
    const newFilename = prompt('Enter new file name:', oldFilename);
    
    if (!newFilename || newFilename === oldFilename || newFilename.trim() === '') {
        return;
    }
    
    // Check if file already exists
    const existingFile = document.querySelector(`#file-list li:contains('${newFilename}')`);
    if (existingFile) {
        alert('A file with this name already exists.');
        return;
    }
    
    // Update file list
    const fileList = document.querySelectorAll('#file-list li');
    for (const file of fileList) {
        if (file.textContent === oldFilename) {
            file.textContent = newFilename;
            break;
        }
    }
    
    // Update tabs
    const tabs = document.querySelectorAll('.tab');
    for (const tab of tabs) {
        if (tab.textContent.replace('×', '').trim() === oldFilename) {
            tab.childNodes[0].nodeValue = newFilename;
            break;
        }
    }
    
    // Update file content cache
    if (fileContents[oldFilename]) {
        fileContents[newFilename] = fileContents[oldFilename];
        delete fileContents[oldFilename];
    }
    
    // Update localStorage
    const content = localStorage.getItem(`file_${oldFilename}`);
    if (content) {
        localStorage.setItem(`file_${newFilename}`, content);
        localStorage.removeItem(`file_${oldFilename}`);
    }
    
    // Update server if we have a project ID
    const projectId = localStorage.getItem('current_project_id');
    if (projectId) {
        renameFileOnServer(projectId, oldFilename, newFilename);
    }
}

function renameFileOnServer(projectId, oldFilename, newFilename) {
    fetch('/api/rename_file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            project_id: projectId,
            old_filename: oldFilename,
            new_filename: newFilename,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'success') {
            console.error('Error renaming file on server:', data.error);
        }
    })
    .catch(error => {
        console.error('Error renaming file on server:', error);
    });
}

function deleteFile(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
        return;
    }
    
    // Remove from file list
    const fileList = document.querySelectorAll('#file-list li');
    for (const file of fileList) {
        if (file.textContent === filename) {
            file.remove();
            break;
        }
    }
    
    // Close any open tabs for this file
    closeFile(filename);
    
    // Remove from cache
    delete fileContents[filename];
    
    // Remove from localStorage
    localStorage.removeItem(`file_${filename}`);
    
    // Remove from server if we have a project ID
    const projectId = localStorage.getItem('current_project_id');
    if (projectId) {
        deleteFileOnServer(projectId, filename);
    }
}

function deleteFileOnServer(projectId, filename) {
    fetch('/api/delete_file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            project_id: projectId,
            filename: filename,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'success') {
            console.error('Error deleting file on server:', data.error);
        }
    })
    .catch(error => {
        console.error('Error deleting file on server:', error);
    });
}

function downloadFile(filename) {
    // Get file content
    let content;
    
    if (fileContents[filename]) {
        content = fileContents[filename];
    } else {
        content = localStorage.getItem(`file_${filename}`);
    }
    
    if (!content) {
        alert('File content not found');
        return;
    }
    
    // Create download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Code formatting
function formatCode() {
    const language = getCurrentLanguage();
    const code = editor.getValue();
    
    fetch('/api/format_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            language: language
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.formatted_code) {
            editor.setValue(data.formatted_code);
            showNotification('Code formatted', 'success');
        } else {
            showNotification('Failed to format code', 'error');
        }
    })
    .catch(error => {
        console.error('Error formatting code:', error);
        showNotification('Error formatting code', 'error');
    });
}

// Comment/uncomment code
function toggleComment(cm) {
    const language = getCurrentLanguage();
    let commentStart, commentEnd;
    
    // Set comment syntax based on language
    switch (language) {
        case 'python':
            commentStart = '# ';
            commentEnd = '';
            break;
        case 'javascript':
        case 'java':
        case 'cpp':
        case 'css':
            commentStart = '// ';
            commentEnd = '';
            break;
        case 'html':
            commentStart = '<!-- ';
            commentEnd = ' -->';
            break;
        default:
            commentStart = '# ';
            commentEnd = '';
    }
    
    const selections = cm.listSelections();
    
    cm.operation(() => {
        for (let i = 0; i < selections.length; i++) {
            const selection = selections[i];
            const start = selection.head.line <= selection.anchor.line ? selection.head : selection.anchor;
            const end = selection.head.line > selection.anchor.line ? selection.head : selection.anchor;
            
            // Check if all lines are commented
            let allCommented = true;
            for (let j = start.line; j <= end.line; j++) {
                const line = cm.getLine(j).trim();
                if (line && !line.startsWith(commentStart)) {
                    allCommented = false;
                    break;
                }
            }
            
            // Toggle comments
            for (let j = start.line; j <= end.line; j++) {
                const line = cm.getLine(j);
                if (line.trim()) {
                    if (allCommented) {
                        // Uncomment
                        if (line.trim().startsWith(commentStart)) {
                            const newLine = line.replace(new RegExp(`^(\\s*)${escapeRegExp(commentStart)}`), '$1');
                            cm.replaceRange(newLine, { line: j, ch: 0 }, { line: j, ch: line.length });
                        }
                    } else {
                        // Comment
                        cm.replaceRange(commentStart + line, { line: j, ch: 0 }, { line: j, ch: line.length });
                    }
                }
            }
        }
    });
}

// Escape special characters for RegExp
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// AI code assistance
function explainCodeSelection() {
    const selection = editor.getSelection();
    
    if (!selection) {
        showNotification('Please select code to explain', 'warning');
        return;
    }
    
    const language = getCurrentLanguage();
    
    // Add user message to chat
    addUserMessage(`Explain this ${language} code:\n\n${selection}`);
    
    // Send to server
    fetch('/api/explain_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: selection,
            language: language,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.explanation) {
            addAssistantMessage(data.explanation);
        } else {
            addAssistantMessage('Sorry, I could not generate an explanation for this code.');
        }
    })
    .catch(error => {
        console.error('Error explaining code:', error);
        addAssistantMessage('Sorry, there was an error processing your request.');
    });
}

function improveCodeSelection() {
    const selection = editor.getSelection();
    
    if (!selection) {
        showNotification('Please select code to improve', 'warning');
        return;
    }
    
    const language = getCurrentLanguage();
    
    // Add user message to chat
    addUserMessage(`Improve this ${language} code:\n\n${selection}`);
    
    // Send to server
    fetch('/api/improve_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: selection,
            language: language,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.improved_code) {
            addAssistantMessage(`Here's an improved version of your code:\n\n\`\`\`${language}\n${data.improved_code}\n\`\`\`\n\n${data.explanation || ''}`);
        } else {
            addAssistantMessage('Sorry, I could not generate improvements for this code.');
        }
    })
    .catch(error => {
        console.error('Error improving code:', error);
        addAssistantMessage('Sorry, there was an error processing your request.');
    });
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Utility function to debounce function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add a contains selector for case-insensitive text matching
jQuery.expr[':'].contains = function(a, i, m) {
    return jQuery(a).text().toUpperCase()
        .indexOf(m[3].toUpperCase()) >= 0;
};
