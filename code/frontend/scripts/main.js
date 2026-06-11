// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initializeEditor();
    initializeVoiceHandler();
    initializeUIController();
    
    // Generate a temporary user ID if not already set
    if (!localStorage.getItem('user_id')) {
        localStorage.setItem('user_id', 'user_' + Math.random().toString(36).substr(2, 9));
    }
    
    // Load user preferences
    loadUserPreferences();
    
    // Set up event listeners for the text input
    const textInput = document.getElementById('text-input');
    const sendBtn = document.getElementById('send-btn');
    
    sendBtn.addEventListener('click', () => {
        sendTextMessage(textInput.value);
    });
    
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendTextMessage(textInput.value);
        }
    });
    
    // Load marked.js for markdown parsing
    loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    
    // Load highlight.js for syntax highlighting
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/highlight.min.js');
    loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/styles/atom-one-dark.min.css');
});

// Load user preferences from server or local storage
function loadUserPreferences() {
    const userId = localStorage.getItem('user_id');
    
    // Try to load from localStorage first
    const storedPreferences = localStorage.getItem('user_preferences');
    if (storedPreferences) {
        const preferences = JSON.parse(storedPreferences);
        applyUserPreferences(preferences);
    }
    
    // Then fetch from server to ensure we have the latest
    fetch(`/api/get_preferences?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.preferences) {
                applyUserPreferences(data.preferences);
                localStorage.setItem('user_preferences', JSON.stringify(data.preferences));
            }
        })
        .catch(error => {
            console.error('Error loading preferences:', error);
        });
}

// Apply user preferences to the UI
function applyUserPreferences(preferences) {
    // Set theme
    document.body.setAttribute('data-theme', preferences.theme || 'dark');
    if (editor) {
        editor.setOption('theme', preferences.theme === 'light' ? 'default' : 'dracula');
    }
    
    // Set font size
    if (preferences.font_size) {
        document.documentElement.style.setProperty('--editor-font-size', `${preferences.font_size}px`);
        if (editor) {
            document.querySelector('.CodeMirror').style.fontSize = `${preferences.font_size}px`;
        }
    }
    
    // Set user name
    if (preferences.user_name) {
        document.getElementById('user-name').textContent = preferences.user_name;
    }
    
    // Store individual preferences in localStorage for easy access
    localStorage.setItem('preferred_language', preferences.preferred_language || 'python');
    localStorage.setItem('skill_level', preferences.skill_level || 'intermediate');
    localStorage.setItem('theme', preferences.theme || 'dark');
    localStorage.setItem('font_size', preferences.font_size || '14');
}

// Utility function to load scripts dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Utility function to load stylesheets dynamically
function loadStylesheet(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}
function formatCode() {
    const code = editor.getValue();
    const language = getCurrentLanguage();
    
    fetch('/api/format_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            language: language,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            editor.setValue(data.formatted_code);
            showResults('Code Formatted', '<div class="success-message">✅ Code formatting complete</div>');
        } else {
            showResults('Error', `<div class="error-message">❌ ${data.error || 'Unknown error'}</div>`);
        }
    })
    .catch(error => {
        console.error('Error formatting code:', error);
        showResults('Error', '<div class="error-message">❌ Failed to format code</div>');
    });
}

function explainCode() {
    const code = editor.getValue();
    const language = getCurrentLanguage();
    
    fetch('/api/explain_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            language: language,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Parse markdown in the explanation
            const explanation = marked.parse(data.explanation);
            showResults('Code Explanation', explanation);
            // Add syntax highlighting to code blocks
            document.querySelectorAll('#results-content pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            showResults('Error', `<div class="error-message">❌ ${data.error || 'Unknown error'}</div>`);
        }
    })
    .catch(error => {
        console.error('Error explaining code:', error);
        showResults('Error', '<div class="error-message">❌ Failed to explain code</div>');
    });
}

function improveCode() {
    const code = editor.getValue();
    const language = getCurrentLanguage();
    
    fetch('/api/improve_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            language: language,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showCodeModal('Code Improvement', data.improved_code, marked.parse(data.explanation));
        } else {
            showResults('Error', `<div class="error-message">❌ ${data.error || 'Unknown error'}</div>`);
        }
    })
    .catch(error => {
        console.error('Error improving code:', error);
        showResults('Error', '<div class="error-message">❌ Failed to improve code</div>');
    });
}

function analyzeCode() {
    const code = editor.getValue();
    const language = getCurrentLanguage();
    
    fetch('/api/analyze_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            language: language,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        let content = '';
        
        if (data.analysis) {
            content += '<h3>Analysis Results</h3>';
            content += `<p>Complexity score: ${data.analysis.complexity}</p>`;
            
            if (data.analysis.issues && data.analysis.issues.length > 0) {
                content += '<h4>Issues Detected</h4><ul>';
                data.analysis.issues.forEach(issue => {
                    content += `<li>${issue}</li>`;
                });
                content += '</ul>';
            }
            
            if (data.analysis.suggestions && data.analysis.suggestions.length > 0) {
                content += '<h4>Suggestions</h4><ul>';
                data.analysis.suggestions.forEach(suggestion => {
                    content += `<li>${suggestion}</li>`;
                });
                content += '</ul>';
            }
        }
        
        if (data.suggestions) {
            content += '<h3>AI Suggestions</h3>';
            content += marked.parse(data.suggestions);
        }
        
        showResults('Code Analysis', content);
        // Add syntax highlighting to code blocks
        document.querySelectorAll('#results-content pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    })
    .catch(error => {
        console.error('Error analyzing code:', error);
        showResults('Error', '<div class="error-message">❌ Failed to analyze code</div>');
    });
}

function generateTests() {
    const code = editor.getValue();
    const language = getCurrentLanguage();
    
    fetch('/api/generate_test_cases', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            language: language,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.test_cases) {
            const content = marked.parse(data.test_cases);
            showResults('Generated Test Cases', content);
            // Add syntax highlighting to code blocks
            document.querySelectorAll('#results-content pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            showResults('Error', `<div class="error-message">❌ ${data.error || 'Failed to generate test cases'}</div>`);
        }
    })
    .catch(error => {
        console.error('Error generating tests:', error);
        showResults('Error', '<div class="error-message">❌ Failed to generate test cases</div>');
    });
}

function generateDocs() {
    const code = editor.getValue();
    const language = getCurrentLanguage();
    
    fetch('/api/generate_documentation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            language: language,
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.documentation) {
            const content = marked.parse(data.documentation);
            showResults('Generated Documentation', content);
            // Add syntax highlighting to code blocks
            document.querySelectorAll('#results-content pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            showResults('Error', `<div class="error-message">❌ ${data.error || 'Failed to generate documentation'}</div>`);
        }
    })
    .catch(error => {
        console.error('Error generating documentation:', error);
        showResults('Error', '<div class="error-message">❌ Failed to generate documentation</div>');
    });
}