// ===================================
// VOICE ASSISTANT - Speech Recognition
// ===================================

class VoiceAssistant {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.initializeElements();
        this.setupRecognition();
        this.setupEventListeners();
    }

    initializeElements() {
        this.voiceBtn = document.getElementById('voiceAssistantBtn');
        this.voicePanel = document.getElementById('voicePanel');
        this.closePanelBtn = document.getElementById('closeVoicePanel');
        this.startBtn = document.getElementById('startListening');
        this.stopBtn = document.getElementById('stopListening');
        this.statusEl = document.getElementById('voiceStatus');
        this.transcriptionEl = document.getElementById('voiceTranscription');
        this.suggestionsEl = document.getElementById('voiceSuggestions');
    }

    setupRecognition() {
        // Check if browser supports Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Web Speech API not supported in this browser');
            if (this.voiceBtn) {
                this.voiceBtn.style.display = 'none';
            }
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US'; // Default to English, can be changed

        // Event: When speech is recognized
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            this.transcript = finalTranscript || interimTranscript;
            console.log('📝 Transcription:', this.transcript); // Debug log
            this.updateTranscription(this.transcript);

            // Process final transcript
            if (finalTranscript) {
                console.log('✅ Final transcript:', finalTranscript); // Debug log
                this.processCommand(finalTranscript.trim());
            }
        };

        // Event: Error handling
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateStatus(`Error: ${event.error}`, false);

            if (event.error === 'no-speech') {
                this.updateStatus('No speech detected. Please try again.', false);
            } else if (event.error === 'not-allowed') {
                this.updateStatus('Microphone permission denied. Please allow  microphone access.', false);
                this.stopListening();
            }
        };

        // Event: When recognition ends
        this.recognition.onend = () => {
            if (this.isListening) {
                // Restart if it was manually stopped by browser
                this.recognition.start();
            } else {
                this.updateStatus('Click the microphone to start', false);
                this.updateButtonStates(false);
            }
        };
    }

    setupEventListeners() {
        // Toggle voice panel
        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => {
                this.togglePanel();
            });
        }

        // Close panel
        if (this.closePanelBtn) {
            this.closePanelBtn.addEventListener('click', () => {
                this.hidePanel();
                this.stopListening();
            });
        }

        // Start listening
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                this.startListening();
            });
        }

        // Stop listening
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => {
                this.stopListening();
            });
        }
    }

    togglePanel() {
        if (!this.voicePanel) return;

        if (this.voicePanel.style.display === 'none' || !this.voicePanel.style.display) {
            this.showPanel();
        } else {
            this.hidePanel();
            this.stopListening();
        }
    }

    showPanel() {
        if (this.voicePanel) {
            this.voicePanel.style.display = 'block';
        }
    }

    hidePanel() {
        if (this.voicePanel) {
            this.voicePanel.style.display = 'none';
        }
    }

    startListening() {
        if (!this.recognition) {
            alert('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        try {
            this.isListening = true;
            this.transcript = '';
            this.transcriptionEl.textContent = '';
            this.recognition.start();
            this.updateStatus('🎙️ Listening...', true);
            this.updateButtonStates(true);
            this.voiceBtn.classList.add('listening-pulse');
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    }

    stopListening() {
        if (!this.recognition) return;

        this.isListening = false;
        this.recognition.stop();
        this.updateStatus('Stopped', false);
        this.updateButtonStates(false);
        this.voiceBtn.classList.remove('listening-pulse');
    }

    updateStatus(message, isListening) {
        if (!this.statusEl) return;

        this.statusEl.querySelector('p').textContent = message;

        if (isListening) {
            this.statusEl.classList.add('listening');
        } else {
            this.statusEl.classList.remove('listening');
        }
    }

    updateTranscription(text) {
        if (this.transcriptionEl) {
            if (text.trim()) {
                this.transcriptionEl.textContent = text;
                this.transcriptionEl.style.color = 'var(--color-text-primary)';
                this.transcriptionEl.style.fontWeight = '500';
            } else {
                this.transcriptionEl.textContent = 'Listening... speak now';
                this.transcriptionEl.style.color = 'var(--color-text-tertiary)';
                this.transcriptionEl.style.fontWeight = '400';
            }
        }
    }

    updateButtonStates(isListening) {
        if (this.startBtn && this.stopBtn) {
            if (isListening) {
                this.startBtn.style.display = 'none';
                this.stopBtn.style.display = 'flex';
            } else {
                this.startBtn.style.display = 'flex';
                this.stopBtn.style.display = 'none';
            }
        }
    }

    processCommand(command) {
        console.log('Processing command:', command);
        const lowerCommand = command.toLowerCase();

        // Detect video creation intent
        const videoTypes = {
            'marketing': ['marketing', 'advertisement', 'ad', 'promo', 'promotional'],
            'tutorial': ['tutorial', 'how to', 'guide', 'teach', 'lesson'],
            'vlog': ['vlog', 'blog', 'daily', 'personal'],
            'educational': ['educational', 'education', 'learning', 'lecture'],
            'birthday': ['birthday', 'celebration', 'party'],
            'wedding': ['wedding', 'marriage', 'ceremony'],
            'product': ['product', 'demo', 'demonstration', 'showcase']
        };

        let detectedType = null;
        for (const [type, keywords] of Object.entries(videoTypes)) {
            if (keywords.some(keyword => lowerCommand.includes(keyword))) {
                detectedType = type;
                break;
            }
        }

        if (detectedType || lowerCommand.includes('video') || lowerCommand.includes('create') || lowerCommand.includes('make')) {
            this.showSuggestion(detectedType || 'general', command);
        } else {
            this.updateStatus('Try saying: "I want to create a marketing video"', false);
        }
    }

    showSuggestion(videoType, originalCommand) {
        if (!this.suggestionsEl) return;

        const suggestions = {
            'marketing': {
                title: '🎯 Marketing Video Project',
                description: 'Create an engaging marketing video with dynamic transitions and call-to-action elements.',
            },
            'tutorial': {
                title: '📚 Tutorial Video Project',
                description: 'Build a step-by-step tutorial with clear visuals and instructional overlays.',
            },
            'vlog': {
                title: '📹 Vlog Project',
                description: 'Create a personal vlog with casual editing and authentic storytelling.',
            },
            'educational': {
                title: '🎓 Educational Video Project',
                description: 'Produce an informative educational video with clear structure and visual aids.',
            },
            'birthday': {
                title: '🎂 Birthday Video Project',
                description: 'Create a festive birthday video with celebration effects and happy music.',
            },
            'wedding': {
                title: '💐 Wedding Video Project',
                description: 'Create a romantic wedding video with elegant transitions and emotional moments.',
            },
            'product': {
                title: '📦 Product Demo Project',
                description: 'Showcase your product with professional presentation and highlight features.',
            },
            'general': {
                title: '🎬 New Video Project',
                description: 'Create a new video project based on your description.',
            }
        };

        const suggestion = suggestions[videoType] || suggestions['general'];

        this.suggestionsEl.innerHTML = `
            <h4>${suggestion.title}</h4>
            <p>${suggestion.description}</p>
            <p style="font-size: 0.85rem; color: var(--color-text-tertiary); margin-top: 0.5rem;">
                Based on: "${originalCommand}"
            </p>
            <button class="btn btn-primary" onclick="voiceAssistant.createProjectFromVoice('${videoType}', \`${originalCommand}\`)">
                Create Project
            </button>
        `;
        this.suggestionsEl.classList.add('active');
    }

    async createProjectFromVoice(videoType, description) {
        console.log('Creating project:', videoType, description);

        // Create a new project name
        const projectName = `${videoType.charAt(0).toUpperCase() + videoType.slice(1)} Video - ${new Date().toLocaleDateString()}`;

        // Check if we're on the index page or dashboard
        const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
        const isDashboard = window.location.pathname.includes('dashboard.html');

        // Stop listening immediately
        this.stopListening();
        this.hidePanel();

        if (isIndexPage || isDashboard) {
            // Store project intent in localStorage
            localStorage.setItem('voice_project_intent', JSON.stringify({
                type: videoType,
                description: description,
                name: projectName,
                timestamp: new Date().toISOString()
            }));

            // If on index, show notification and redirect to dashboard
            if (typeof showNotification === 'function') {
                showNotification(`Creating ${videoType} video project... ⏳`, 'info');
            } else {
                alert(`Creating ${videoType} video project...`);
            }

            // Redirect to dashboard to create project
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        } else {
            // On editor page, just show notification
            if (typeof showNotification === 'function') {
                showNotification(`Project idea saved: ${projectName}`, 'success');
            }
        }
    }
}

// Initialize voice assistant when DOM is loaded
let voiceAssistant;
document.addEventListener('DOMContentLoaded', () => {
    voiceAssistant = new VoiceAssistant();
    console.log('🎙️ Voice Assistant initialized');
});
