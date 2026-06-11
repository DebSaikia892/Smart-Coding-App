// UI interactions and settings management
function initializeUIController() {
    // Settings modal
    const formatBtn = document.getElementById('format-btn');
    const explainBtn = document.getElementById('explain-btn');
    const improveBtn = document.getElementById('improve-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const testBtn = document.getElementById('test-btn');
    const docBtn = document.getElementById('doc-btn');
    const resultsPanel = document.getElementById('results-panel');
    const closeResultsBtn = document.getElementById('close-results');
    const codeModal = document.getElementById('code-modal');
    const closeCodeModalBtn = document.getElementById('close-code-modal');
    const applyChangesBtn = document.getElementById('apply-changes');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeBtn = document.querySelector('.close');
    const saveSettingsBtn = document.getElementById('save-settings');
    
    // Font size slider
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    
    // Assistant panel collapse button
    const collapseAssistantBtn = document.getElementById('collapse-assistant');
    
    // Open settings modal
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
        loadSettingsToUI();
    });
    formatBtn.addEventListener('click', () => {
        showLoading('Formatting code...');
        formatCode();
    });
    
    explainBtn.addEventListener('click', () => {
        showLoading('Generating explanation...');
        explainCode();
    });
    
    improveBtn.addEventListener('click', () => {
        showLoading('Improving code...');
        improveCode();
    });
    
    analyzeBtn.addEventListener('click', () => {
        showLoading('Analyzing code...');
        analyzeCode();
    });
    
    testBtn.addEventListener('click', () => {
        showLoading('Generating tests...');
        generateTests();
    });
    
    docBtn.addEventListener('click', () => {
        showLoading('Generating documentation...');
        generateDocs();
    });
    
    closeResultsBtn.addEventListener('click', () => {
        resultsPanel.style.display = 'none';
        // Resize editor to fill space
        editor.refresh();
    });
    
    closeCodeModalBtn.addEventListener('click', () => {
        codeModal.style.display = 'none';
    });
    
    applyChangesBtn.addEventListener('click', () => {
        const improvedCode = document.getElementById('improved-code-content').textContent;
        editor.setValue(improvedCode);
        codeModal.style.display = 'none';
    });
    // Close settings modal
    closeBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // Save settings
    saveSettingsBtn.addEventListener('click', () => {
        saveSettingsFromUI();
        settingsModal.style.display = 'none';
    });
    
    // Update font size display
    fontSizeSlider.addEventListener('input', () => {
        const size = fontSizeSlider.value;
        fontSizeValue.textContent = `${size}px`;
        
        // Update editor font size in real-time
        document.querySelector('.CodeMirror').style.fontSize = `${size}px`;
    });
    
    // Toggle assistant panel
    let assistantExpanded = true;
    collapseAssistantBtn.addEventListener('click', () => {
        const assistantPanel = document.querySelector('.assistant-panel');
        
        if (assistantExpanded) {
            // Collapse
            assistantPanel.style.height = '40px';
            collapseAssistantBtn.textContent = '+';
        } else {
            // Expand
            assistantPanel.style.height = '30%';
            collapseAssistantBtn.textContent = '−';
        }
        
        assistantExpanded = !assistantExpanded;
    });
    
    // Apply initial theme
    applyTheme(localStorage.getItem('theme') || 'dark');
}

function loadSettingsToUI() {
    // Load preferences from localStorage
    const languageSelect = document.getElementById('language-select');
    const skillLevel = document.getElementById('skill-level');
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    
    // Set values from localStorage or use defaults
    languageSelect.value = localStorage.getItem('preferred_language') || 'python';
    skillLevel.value = localStorage.getItem('skill_level') || 'intermediate';
    themeSelect.value = localStorage.getItem('theme') || 'dark';
    
    const fontSize = localStorage.getItem('font_size') || '14';
    fontSizeSlider.value = fontSize;
    fontSizeValue.textContent = `${fontSize}px`;
}

function saveSettingsFromUI() {
    // Get values from UI
    const languageSelect = document.getElementById('language-select');
    const skillLevel = document.getElementById('skill-level');
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSlider = document.getElementById('font-size');
    
    // Save to localStorage
    localStorage.setItem('preferred_language', languageSelect.value);
    localStorage.setItem('skill_level', skillLevel.value);
    localStorage.setItem('theme', themeSelect.value);
    localStorage.setItem('font_size', fontSizeSlider.value);
    
    // Apply theme
    applyTheme(themeSelect.value);
    
    // Apply font size
    document.querySelector('.CodeMirror').style.fontSize = `${fontSizeSlider.value}px`;
    
    // Save to server
    const userId = localStorage.getItem('user_id');
    const preferences = {
        preferred_language: languageSelect.value,
        skill_level: skillLevel.value,
        theme: themeSelect.value,
        font_size: parseInt(fontSizeSlider.value)
    };
    
    fetch('/api/save_preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId,
            preferences: preferences
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Preferences saved:', data);
    })
    .catch(error => {
        console.error('Error saving preferences:', error);
    });
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        editor.setOption('theme', 'dracula');
    } else {
        document.body.classList.remove('dark-theme');
        editor.setOption('theme', 'default');
    }
}
function showLoading(message) {
    document.getElementById('results-title').textContent = message;
    document.getElementById('results-content').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    resultsPanel.style.display = 'flex';
}

function showResults(title, content) {
    document.getElementById('results-title').textContent = title;
    document.getElementById('results-content').innerHTML = content;
    resultsPanel.style.display = 'flex';
}

function showCodeModal(title, improvedCode, explanation) {
    document.getElementById('modal-title').textContent = title;
    const content = `
        <h3>Improved Code</h3>
        <pre><code id="improved-code-content">${improvedCode}</code></pre>
        <h3>Explanation</h3>
        <div>${explanation}</div>
    `;
    document.getElementById('modal-content').innerHTML = content;
    // Highlight code using highlight.js if it's loaded
    if (window.hljs) {
        document.querySelectorAll('#modal-content pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
    codeModal.style.display = 'block';
}
