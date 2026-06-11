// Voice recording and processing functionality
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function initializeVoiceHandler() {
    const recordButton = document.getElementById('voice-record-btn');
    const voiceStatus = document.getElementById('voice-status');
    
    // Request microphone access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('Media devices supported');
    } else {
        voiceStatus.textContent = 'Voice recording not supported in this browser';
        recordButton.disabled = true;
        return;
    }
    
    // Set up record button
    recordButton.addEventListener('click', toggleRecording);
    
    // Listen for Enter key to stop recording
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && isRecording) {
            toggleRecording();
        }
    });
}

async function toggleRecording() {
    const recordButton = document.getElementById('voice-record-btn');
    const voiceStatus = document.getElementById('voice-status');
    
    if (!isRecording) {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = processRecording;
            
            mediaRecorder.start();
            isRecording = true;
            
            recordButton.textContent = '🔴 Recording... (Press Enter to stop)';
            recordButton.classList.add('recording');
            voiceStatus.textContent = 'Listening...';
            
            // Start recording timer
            startRecordingTimer();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            voiceStatus.textContent = 'Error accessing microphone';
        }
    } else {
        // Stop recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            isRecording = false;
            
            recordButton.innerHTML = '<span class="icon">🎤</span> Start Recording';
            recordButton.classList.remove('recording');
            voiceStatus.textContent = 'Processing...';
            
            // Stop recording timer
            stopRecordingTimer();
        }
    }
}

let recordingTimer;
let recordingDuration = 0;

function startRecordingTimer() {
    recordingDuration = 0;
    const voiceStatus = document.getElementById('voice-status');
    
    recordingTimer = setInterval(() => {
        recordingDuration += 1;
        voiceStatus.textContent = `Recording... ${recordingDuration}s`;
    }, 1000);
}

function stopRecordingTimer() {
    clearInterval(recordingTimer);
}

function processRecording() {
    const voiceStatus = document.getElementById('voice-status');
    
    // Create audio blob from chunks
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    
    // Create form data to send to server
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('user_id', localStorage.getItem('user_id'));
    
    // Send to server for processing
    fetch('/api/process_voice', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        voiceStatus.textContent = 'Ready to listen...';
        
        // Add the transcribed text to the text input
        const textInput = document.getElementById('text-input');
        textInput.value = data.text;
        
        // Handle voice commands for code operations
        const command = data.text.toLowerCase();
        if (command.includes('format') && command.includes('code')) {
            formatCode();
            return;
        } else if (command.includes('explain') && command.includes('code')) {
            explainCode();
            return;
        } else if (command.includes('improve') && command.includes('code')) {
            improveCode();
            return;
        } else if (command.includes('analyze') && command.includes('code')) {
            analyzeCode();
            return;
        } else if (command.includes('generate') && command.includes('test')) {
            generateTests();
            return;
        } else if (command.includes('document') || (command.includes('generate') && command.includes('documentation'))) {
            generateDocs();
            return;
        }
        
        // If we got a response from Gemini, add it to the chat
        if (data.response) {
            addAssistantMessage(data.response);
        }
    })
}

function sendTextMessage(text) {
    if (!text.trim()) return;
    
    // Add user message to chat
    addUserMessage(text);
    
    // Clear input
    const textInput = document.getElementById('text-input');
    textInput.value = '';
    
    // Send to server
    fetch('/api/analyze_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: text,
            code: editor.getValue(),
            language: getCurrentLanguage(),
            user_id: localStorage.getItem('user_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        // Add assistant response to chat
        addAssistantMessage(data.response || data.suggestions);
    })
    .catch(error => {
        console.error('Error sending message:', error);
        addAssistantMessage('Sorry, there was an error processing your request.');
    });
}

function addUserMessage(text) {
    const messagesContainer = document.getElementById('assistant-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addAssistantMessage(text) {
    const messagesContainer = document.getElementById('assistant-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Process markdown in the response
    const formattedText = marked.parse(text);
    contentDiv.innerHTML = formattedText;
    
    // Add syntax highlighting to code blocks
    contentDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
