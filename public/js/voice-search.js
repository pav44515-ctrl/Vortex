// ===================================
// VOICE SEARCH - Project Search with Voice
// ===================================

class VoiceSearch {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.searchInput = document.getElementById('projectSearch');
        this.voiceSearchBtn = document.getElementById('voiceSearchBtn');

        this.setupRecognition();
        this.setupEventListeners();
    }

    setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Web Speech API not supported');
            if (this.voiceSearchBtn) {
                this.voiceSearchBtn.style.display = 'none';
            }
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;  // Stop after one result
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    this.searchInput.value = transcript;
                    this.performSearch(transcript);
                    this.stopListening();
                } else {
                    // Show interim results in search box
                    this.searchInput.value = transcript;
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Voice search error:', event.error);
            this.stopListening();
        };

        this.recognition.onend = () => {
            this.stopListening();
        };
    }

    setupEventListeners() {
        if (this.voiceSearchBtn) {
            this.voiceSearchBtn.addEventListener('click', () => {
                if (this.isListening) {
                    this.stopListening();
                } else {
                    this.startListening();
                }
            });
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
        }
    }

    startListening() {
        if (!this.recognition) {
            alert('Voice recognition not supported in your browser.');
            return;
        }

        this.isListening = true;
        this.voiceSearchBtn.classList.add('listening');
        this.searchInput.placeholder = '🎤 Listening...';
        this.recognition.start();
    }

    stopListening() {
        if (!this.recognition) return;

        this.isListening = false;
        this.voiceSearchBtn.classList.remove('listening');
        this.searchInput.placeholder = '🔍 Search projects...';

        try {
            this.recognition.stop();
        } catch (e) {
            // Already stopped
        }
    }

    performSearch(query) {
        const projectsGrid = document.getElementById('projectsGrid');
        const projectCards = projectsGrid.querySelectorAll('.project-card');

        if (!query.trim()) {
            // Show all projects if search is empty
            projectCards.forEach(card => {
                card.style.display = 'block';
            });
            return;
        }

        const lowerQuery = query.toLowerCase();
        let visibleCount = 0;

        projectCards.forEach(card => {
            const projectName = card.querySelector('h3, .project-title')?.textContent.toLowerCase() || '';
            const projectDesc = card.textContent.toLowerCase();

            if (projectName.includes(lowerQuery) || projectDesc.includes(lowerQuery)) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        console.log(`Search: "${query}" - Found ${visibleCount} projects`);
    }
}

// Initialize voice search when DOM is loaded
let voiceSearch;
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on dashboard page
    if (document.getElementById('projectSearch')) {
        voiceSearch = new VoiceSearch();
        console.log('🔍 Voice Search initialized');
    }
});
