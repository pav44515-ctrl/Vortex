// ===================================
// AI VIDEO STUDIO - MAIN APPLICATION
// ===================================

// State Management
const state = {
    user: null,
    currentProject: null,
    mediaFiles: [],
    timelineClips: [],
    isAuthenticated: false,
    currentPreviewFile: null,
    zoomLevel: 1,
    history: [],
    historyIndex: -1,
    currentClipIndex: 0,
    isPlayingSequence: false
};

// Check if running in demo mode (GitHub Pages)
const isDemoMode = window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname === 'pav44515-ctrl.github.io';

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 AI Video Studio initialized');
    checkAuthentication();
    setupEventListeners();

    // Only initialize editor if we are on the editor page
    if (document.getElementById('editor')) {
        initializeEditor();
        setupVoiceEffects();
    }

    setupAnimations();
});
// AUTHENTICATION
// ===================================

function checkAuthentication() {
    if (isDemoMode) {
        console.log('Demo mode detected: Backend features disabled');
        const fakeUser = localStorage.getItem('demo_user');
        if (fakeUser) {
            state.isAuthenticated = true;
            state.user = JSON.parse(fakeUser);
            updateUIForAuthenticatedUser();
            if (document.getElementById('editor')) {
                updateEditorUI();
            }
        }
        return;
    }

    fetch('/api/auth/check', {
        credentials: 'include'
    })
        .then(res => res.json())
        .then(data => {
            if (data.authenticated) {
                state.isAuthenticated = true;
                state.user = data.user;
                updateUIForAuthenticatedUser();
                if (document.getElementById('editor')) {
                    updateEditorUI();
                }
            }
        })
        .catch(err => {
            console.log('Not authenticated');
        });
}


function updateUIForAuthenticatedUser() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');

    if (loginBtn && signupBtn && state.user) {
        // Change login button to show user name
        loginBtn.textContent = `👤 ${state.user.name}`;
        loginBtn.style.pointerEvents = 'none'; // Disable clicking on name

        // Change signup button to logout
        signupBtn.textContent = '🚪 Logout';
        signupBtn.classList.remove('btn-primary');
        signupBtn.classList.add('btn-secondary');
        signupBtn.style.display = 'inline-flex';

        // Add logout handler
        signupBtn.onclick = (e) => {
            e.preventDefault();
            handleLogout();
        };
    }
}

async function handleLogout() {
    if (isDemoMode) {
        localStorage.removeItem('demo_user');
        showNotification('Logged out (Demo Mode) 👋', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 800);
        return;
    }

    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            showNotification('Logged out successfully! 👋', 'success');

            // Reload page after a short delay to show notification
            setTimeout(() => {
                window.location.reload();
            }, 800);
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed. Please try again.', 'error');
    }
}


// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    // Modal Controls
    setupModalListeners();

    // Authentication Forms
    setupAuthForms();

    // Editor Controls
    if (document.getElementById('editor')) {
        setupEditorListeners();
    }

    // Feature Cards
    setupFeatureCards();

    // Smooth Scrolling
    setupSmoothScroll();

    // Home Page Buttons
    setupHomePageButtons();
}

function setupEditorListeners() {
    // Media Import
    setupMediaImport();

    // Tool Buttons (Header & Timeline)
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text.includes('Cut')) btn.onclick = splitClip;
        if (text.includes('Effects')) btn.onclick = () => showFeatureDemo('color-grading');
        if (text.includes('Audio')) btn.onclick = () => showNotification('Audio tools selected 🎵', 'info');
        if (text.includes('Text')) btn.onclick = addTextOverlay;
        if (text.includes('AI Tools')) btn.onclick = () => showFeatureDemo('auto-edit');
        if (text.includes('Undo')) btn.onclick = undo;
        if (text.includes('Redo')) btn.onclick = redo;
        if (text.includes('Export')) btn.onclick = exportVideo;
        if (text.includes('Share')) btn.onclick = shareProject;
        if (text.includes('Add Track')) btn.onclick = addTrack;
        if (text.includes('Zoom')) btn.onclick = () => setZoom(state.zoomLevel + 0.1);
        if (text === '+') btn.onclick = () => setZoom(state.zoomLevel + 0.1);
        if (text === '-') btn.onclick = () => setZoom(state.zoomLevel - 0.1);
        if (text.includes('Apply Effect')) btn.onclick = applyVoiceEffect;
    });

    // Tool Items (Left Panel) - Specific handlers
    // Tool Items (Left Panel) - Specific handlers using Event Delegation
    const toolsGrid = document.querySelector('.tools-grid');
    if (toolsGrid) {
        toolsGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.tool-item');
            if (!item) return;

            const label = item.querySelector('.tool-label').textContent.trim();
            console.log(`Tool clicked: ${label}`); // Debugging

            switch (label) {
                case 'Auto Edit':
                    showFeatureDemo('auto-edit');
                    break;
                case 'Magic Cut':
                    showFeatureDemo('scene-detection');
                    break;
                case 'Voiceover':
                    synthesizeVoice();
                    break;
                case 'Color':
                    applyColorGrading();
                    break;
                default:
                    showNotification(`${label} tool activated 🚀`, 'success');
            }
        });
    }

    // Property Panel Controls
    setupPropertyControls();
}

function setupMediaImport() {
    const importBtn = document.getElementById('mediaLibraryUpload');
    if (!importBtn) return;

    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,audio/*,image/*';
    input.multiple = true;
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = (e) => {
        if (e.target.files.length > 0) {
            handleFileDrop(e.target.files);
        }
    };

    importBtn.addEventListener('click', () => {
        input.click();
    });

    // Drag and drop support
    importBtn.addEventListener('dragover', (e) => {
        e.preventDefault();
        importBtn.style.borderColor = 'var(--color-accent-purple)';
        importBtn.style.background = 'rgba(168, 85, 247, 0.1)';
    });

    importBtn.addEventListener('dragleave', (e) => {
        e.preventDefault();
        importBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        importBtn.style.background = 'transparent';
    });

    importBtn.addEventListener('drop', (e) => {
        e.preventDefault();
        importBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        importBtn.style.background = 'transparent';

        if (e.dataTransfer.files.length > 0) {
            handleFileDrop(e.dataTransfer.files);
        }
    });
}

function updateEditorUI() {
    if (!state.user) return;

    const userAvatar = document.querySelector('.app-header .btn-primary + div');
    if (userAvatar) {
        userAvatar.textContent = state.user.name.charAt(0).toUpperCase();
        userAvatar.title = state.user.name;
    }
}

function setupPropertyControls() {
    // Voice Preset - Store selected preset
    const voicePreset = document.getElementById('voicePreset');
    if (voicePreset) {
        voicePreset.addEventListener('change', (e) => {
            showNotification(`Voice preset selected: ${e.target.value} 🎙️`, 'info');
        });
    }

    // Pitch Slider - Show current pitch value
    const pitchSlider = document.getElementById('pitchSlider');
    if (pitchSlider) {
        pitchSlider.addEventListener('input', (e) => {
            const pitchValue = e.target.value;
            showNotification(`Pitch: ${pitchValue > 0 ? '+' : ''}${pitchValue}`, 'info');
        });
    }

    // Video Speed Slider
    const speedSlider = document.getElementById('speedSlider');
    const speedValueDisplay = document.getElementById('speedValue');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            if (speedValueDisplay) speedValueDisplay.textContent = `${speed}x`;

            const video = document.querySelector('.preview-screen video');
            if (video) {
                video.playbackRate = speed;
                // Reset pitch preservation to default (true) for normal speed changes
                // unless user explicitly wants chipmunk effect (which we don't have a toggle for yet)
                if (video.preservesPitch !== undefined) video.preservesPitch = true;
            }
        });
    }

    // Opacity Slider - Use ID for robustness
    const opacitySlider = document.getElementById('opacitySlider');
    if (opacitySlider) {
        opacitySlider.addEventListener('input', (e) => {
            const video = document.querySelector('.preview-screen video');
            const img = document.querySelector('.preview-screen img');
            const opacity = e.target.value / 100;
            if (video) video.style.opacity = opacity;
            if (img) img.style.opacity = opacity;
        });
    }

    // Transform Inputs
    const transformInputs = document.querySelectorAll('.prop-input[type="number"]');
    transformInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const video = document.querySelector('.preview-screen video');
            const img = document.querySelector('.preview-screen img');
            const value = e.target.value;
            const element = video || img;
            if (element) {
                if (index === 0) element.style.transform = `translateX(${value}px)`;
                else element.style.transform = `translateY(${value}px)`;
            }
        });
    });
}

function setupModalListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const startEditingBtn = document.getElementById('startEditingBtn');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const closeSignupModal = document.getElementById('closeSignupModal');
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');

    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!state.isAuthenticated) {
                openModal(loginModal);
            }
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(signupModal);
        });
    }

    if (startEditingBtn) {
        startEditingBtn.addEventListener('click', () => {
            if (state.isAuthenticated) {
                scrollToEditor();
            } else {
                openModal(signupModal);
            }
        });
    }

    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', () => closeModal(loginModal));
    }

    if (closeSignupModal) {
        closeSignupModal.addEventListener('click', () => closeModal(signupModal));
    }

    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(loginModal);
            openModal(signupModal);
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(signupModal);
            openModal(loginModal);
        });
    }

    // Close modals on outside click
    [loginModal, signupModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        }
    });
}

function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (isDemoMode) {
        const fakeUser = { id: 'demo-123', name: 'Demo User', email: email };
        state.isAuthenticated = true;
        state.user = fakeUser;
        localStorage.setItem('demo_user', JSON.stringify(fakeUser));

        updateUIForAuthenticatedUser();
        closeModal(document.getElementById('loginModal'));
        showNotification('Welcome back! (Demo Mode) 🎉', 'success');
        if (typeof loadUserProjects === 'function') loadUserProjects();
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            state.isAuthenticated = true;
            state.user = data.user;
            updateUIForAuthenticatedUser();
            closeModal(document.getElementById('loginModal'));
            showNotification('Welcome back! 🎉', 'success');
            if (typeof loadUserProjects === 'function') loadUserProjects();
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Connection error. Please try again.', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (isDemoMode) {
        const fakeUser = { id: 'demo-123', name: name, email: email };
        state.isAuthenticated = true;
        state.user = fakeUser;
        localStorage.setItem('demo_user', JSON.stringify(fakeUser));

        updateUIForAuthenticatedUser();
        closeModal(document.getElementById('signupModal'));
        showNotification('Account created! (Demo Mode) 🎉', 'success');
        scrollToEditor();
        return;
    }

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            state.isAuthenticated = true;
            state.user = data.user;
            updateUIForAuthenticatedUser();
            closeModal(document.getElementById('signupModal'));
            showNotification('Account created successfully! 🎉', 'success');
            scrollToEditor();
        } else {
            showNotification(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Connection error. Please try again.', 'error');
    }
}

// ===================================
// EDITOR FUNCTIONALITY
// ===================================

function initializeEditor() {
    // Initialize timeline
    setupTimeline();
    setupPlayhead();
}

function setupPlayhead() {
    const playhead = document.getElementById('playhead');
    const playheadMarker = document.getElementById('playheadMarker');
    const timelineContent = document.querySelector('.timeline-area .panel-content');

    if (!playhead || !playheadMarker || !timelineContent) return;

    let isDragging = false;

    playheadMarker.addEventListener('mousedown', (e) => {
        isDragging = true;
        playheadMarker.style.cursor = 'grabbing';
        e.preventDefault(); // Prevent text selection
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const rect = timelineContent.getBoundingClientRect();
        // Calculate x relative to the scrollable content
        let x = e.clientX - rect.left + timelineContent.scrollLeft;

        // Constrain to timeline width
        x = Math.max(0, x);
        playhead.style.left = `${x}px`;

        // Sync video if exists
        const video = document.querySelector('.preview-screen video');
        if (video && video.duration) {
            const percent = x / timelineContent.offsetWidth;
            video.currentTime = percent * video.duration;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            playheadMarker.style.cursor = 'ew-resize';
        }
    });
}

function handleFileDrop(files) {
    Array.from(files).forEach(file => {
        const fileData = {
            id: generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file)
        };

        state.mediaFiles.push(fileData);
        addMediaToLibrary(fileData);
        showNotification(`Added ${file.name} 📁`, 'success');

        // Add to timeline if video
        if (fileData.type.startsWith('video/')) {
            addClipToTimeline(fileData, state.timelineClips.length);
        }
    });
}

function addMediaToLibrary(fileData) {
    const mediaLibrary = document.getElementById('mediaLibrary');

    // Create media item
    const mediaItem = document.createElement('div');
    mediaItem.className = 'glass-card';
    mediaItem.style.cssText = 'padding: 0.5rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; aspect-ratio: 1;';
    mediaItem.innerHTML = `
        <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">
            ${fileData.type.startsWith('video/') ? '🎬' : fileData.type.startsWith('audio/') ? '🎵' : '🖼️'}
        </div>
        <p style="font-size: 0.75rem; color: var(--color-text-secondary); text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">
            ${fileData.name}
        </p>
    `;

    mediaItem.addEventListener('click', () => {
        addClipToTimeline(fileData, state.timelineClips.length);
    });

    if (mediaLibrary) {
        mediaLibrary.appendChild(mediaItem);
    }
}

function setupTimeline() {
    // Timeline is ready for clips
    console.log('Timeline initialized');
}

function addClipToTimeline(fileData, trackIndex) {
    const clip = {
        id: generateId(),
        fileId: fileData.id,
        name: fileData.name,
        fileData: fileData,
        track: trackIndex,
        startTime: 0,
        duration: 5 // Default duration
    };

    state.timelineClips.push(clip);
    addToHistory();
    renderTimelineClip(clip);

    // Update preview to show sequence if multiple videos
    if (getVideoClips().length > 1) {
        setupVideoSequence();
    } else {
        updatePreview(fileData);
    }
}

function renderTimelineClip(clip) {
    const tracks = document.querySelectorAll('.timeline-track');
    if (tracks[clip.track]) {
        const clipElement = document.createElement('div');
        clipElement.className = 'timeline-clip';
        clipElement.textContent = clip.name;
        clipElement.draggable = true;

        // Apply zoom
        const width = (clip.duration * 20) * state.zoomLevel; // Base 20px per second
        clipElement.style.width = `${width}px`;

        clipElement.addEventListener('click', () => {
            showNotification(`Selected: ${clip.name}`, 'info');
        });

        tracks[clip.track].appendChild(clipElement);
    }
}

// ===================================
// EDITOR ACTIONS
// ===================================

function setZoom(level) {
    state.zoomLevel = Math.max(0.5, Math.min(3, level));
    showNotification(`Zoom: ${Math.round(state.zoomLevel * 100)}% 🔍`, 'info');

    // Apply zoom to video/image preview
    const video = document.querySelector('.preview-screen video');
    const img = document.querySelector('.preview-screen img');
    const element = video || img;

    if (element) {
        element.style.transform = `scale(${state.zoomLevel})`;
        element.style.transformOrigin = 'center center';
    } else {
        showNotification('No media to zoom', 'error');
    }
}

function addTrack() {
    const trackContainer = document.querySelector('.timeline-tracks');
    if (trackContainer) {
        const track = document.createElement('div');
        track.className = 'timeline-track';
        track.style.cssText = 'height: 80px; border-bottom: 1px solid rgba(255,255,255,0.05); position: relative; min-width: 100%;';
        trackContainer.appendChild(track);
        showNotification('New track added ➕', 'success');
        addToHistory();
    }
}

function splitClip() {
    const playhead = document.getElementById('playhead');
    if (!playhead) return;

    // Simplified split: just duplicate the last clip for demo
    if (state.timelineClips.length > 0) {
        const lastClip = state.timelineClips[state.timelineClips.length - 1];
        const newClip = { ...lastClip, id: generateId(), name: `${lastClip.name} (Part 2)` };
        state.timelineClips.push(newClip);
        renderTimelineClip(newClip);
        showNotification('Clip split at playhead ✂️', 'success');
        addToHistory();
    } else {
        showNotification('No clip to split', 'error');
    }
}

// ===================================
// VIDEO SEQUENCING & COMBINING
// ===================================

function getVideoClips() {
    return state.timelineClips.filter(clip => {
        const file = state.mediaFiles.find(f => f.id === clip.fileId);
        return file && file.type.startsWith('video/');
    });
}

function setupVideoSequence() {
    const videoClips = getVideoClips();
    if (videoClips.length === 0) return;

    state.currentClipIndex = 0;
    state.isPlayingSequence = true;

    const firstClip = videoClips[0];
    const firstFile = state.mediaFiles.find(f => f.id === firstClip.fileId);

    if (firstFile) {
        updatePreviewWithSequence(firstFile);
        showNotification(`Video sequence ready: ${videoClips.length} videos 🎬`, 'success');
    }
}

function updatePreviewWithSequence(fileData) {
    state.currentPreviewFile = fileData;
    const previewScreen = document.querySelector('.preview-screen');

    if (fileData.type.startsWith('video/')) {
        previewScreen.innerHTML = `
            <video src="${fileData.url}" controls style="max-width: 100%; max-height: 100%; border-radius: 0.5rem;">
            </video>
        `;

        const video = previewScreen.querySelector('video');

        // Add sequence playing logic
        video.addEventListener('ended', () => {
            playNextInSequence();
        });

        // Sync playhead
        video.addEventListener('timeupdate', () => {
            const playhead = document.getElementById('playhead');
            const timelineContent = document.querySelector('.timeline-area .panel-content');
            if (playhead && timelineContent && video.duration) {
                const percent = video.currentTime / video.duration;
                const x = percent * timelineContent.offsetWidth;
                playhead.style.left = `${x}px`;
            }
        });
    }
}

function playNextInSequence() {
    const videoClips = getVideoClips();
    state.currentClipIndex++;

    if (state.currentClipIndex < videoClips.length) {
        const nextClip = videoClips[state.currentClipIndex];
        const nextFile = state.mediaFiles.find(f => f.id === nextClip.fileId);

        if (nextFile) {
            showNotification(`Playing video ${state.currentClipIndex + 1}/${videoClips.length} 🎬`, 'info');
            updatePreviewWithSequence(nextFile);

            // Auto-play next video
            setTimeout(() => {
                const video = document.querySelector('.preview-screen video');
                if (video) video.play();
            }, 100);
        }
    } else {
        // Sequence complete
        showNotification('Video sequence completed! 🎉', 'success');
        state.currentClipIndex = 0;
    }
}

function combineVideosForExport() {
    const videoClips = getVideoClips();

    if (videoClips.length === 0) {
        showNotification('No videos to combine', 'error');
        return null;
    }

    if (videoClips.length === 1) {
        // Single video, just export normally
        const video = document.querySelector('.preview-screen video');
        return video;
    }

    // Multiple videos - need to combine
    showNotification(`Combining ${videoClips.length} videos... This may take a moment. ⏳`, 'info');
    return videoClips;
}

function addTextOverlay() {
    const previewScreen = document.querySelector('.preview-screen');
    const text = document.createElement('div');
    text.contentEditable = true;
    text.textContent = 'Double click to edit';
    text.style.cssText = `
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        color: white; font-size: 2rem; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        cursor: move; border: 2px dashed rgba(255,255,255,0.5); padding: 0.5rem;
    `;

    text.addEventListener('mousedown', (e) => {
        // Simple drag logic could go here
    });

    previewScreen.appendChild(text);
    showNotification('Text overlay added 💬', 'success');
    addToHistory();
}

function addToHistory() {
    // Deep copy state for history
    const historyState = JSON.stringify({
        clips: state.timelineClips,
        tracks: document.querySelectorAll('.timeline-track').length
    });

    // Remove future history if we were in the middle
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }

    state.history.push(historyState);
    state.historyIndex++;
}

function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        restoreHistoryState(state.history[state.historyIndex]);
        showNotification('Undid last action ↩️', 'info');
    } else {
        showNotification('Nothing to undo', 'info');
    }
}

function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreHistoryState(state.history[state.historyIndex]);
        showNotification('Redid last action ↪️', 'info');
    } else {
        showNotification('Nothing to redo', 'info');
    }
}

function restoreHistoryState(historyString) {
    const historyState = JSON.parse(historyString);
    state.timelineClips = historyState.clips;

    // Restore tracks count
    const trackContainer = document.querySelector('.timeline-tracks');
    const currentTracks = document.querySelectorAll('.timeline-track').length;

    if (historyState.tracks > currentTracks) {
        for (let i = 0; i < historyState.tracks - currentTracks; i++) addTrack();
    } else if (historyState.tracks < currentTracks) {
        const tracks = document.querySelectorAll('.timeline-track');
        for (let i = currentTracks - 1; i >= historyState.tracks; i--) {
            if (tracks[i]) tracks[i].remove();
        }
    }

    // Re-render clips
    document.querySelectorAll('.timeline-clip').forEach(el => el.remove());
    state.timelineClips.forEach(renderTimelineClip);
}

function updatePreview(fileData) {
    state.currentPreviewFile = fileData;
    const previewScreen = document.querySelector('.preview-screen');

    if (fileData.type.startsWith('video/')) {
        previewScreen.innerHTML = `
            <video src="${fileData.url}" controls style="max-width: 100%; max-height: 100%; border-radius: 0.5rem;">
            </video>
        `;

        const video = previewScreen.querySelector('video');
        video.addEventListener('timeupdate', () => {
            const playhead = document.getElementById('playhead');
            const timelineContent = document.querySelector('.timeline-area .panel-content');
            if (playhead && timelineContent && video.duration) {
                const percent = video.currentTime / video.duration;
                const x = percent * timelineContent.offsetWidth;
                playhead.style.left = `${x}px`;
            }
        });
    } else if (fileData.type.startsWith('image/')) {
        previewScreen.innerHTML = `
            <img src="${fileData.url}" style="max-width: 100%; max-height: 100%; border-radius: 0.5rem;">
        `;
    }
}

// ===================================
// FEATURE CARDS INTERACTION
// ===================================

function setupFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.dataset.feature;
            showFeatureDemo(feature);
        });
    });
}

function showFeatureDemo(feature) {
    const featureMessages = {
        'auto-edit': '🤖 AI Auto-Edit analyzes your footage and creates perfect cuts automatically!',
        'scene-detection': '🎯 Smart Scene Detection identifies all scenes, faces, and objects in your video!',
        'voice-synthesis': '🎙️ AI Voice Synthesis generates professional voiceovers in any language!',
        'color-grading': '🎨 AI Color Grading applies cinematic color palettes instantly!',
        'subtitles': '💬 Auto Subtitles generates accurate captions in 100+ languages!',
        'background-removal': '✂️ Background Removal works perfectly without a green screen!',
        'music-generation': '🎵 AI Music Generation creates custom royalty-free soundtracks!',
        'upscaling': '📈 AI Upscaling enhances your video quality up to 4K!',
        'motion-tracking': '🎯 Motion Tracking follows objects and faces automatically!'
    };

    if (feature === 'color-grading') {
        applyColorGrading();
        return;
    }

    if (feature === 'voice-synthesis') {
        synthesizeVoice();
        return;
    }

    // Simulate processing for other features
    simulateProcessing(featureMessages[feature] || 'Processing AI Feature...');
}

function applyColorGrading() {
    const video = document.querySelector('.preview-screen video');
    if (!video) {
        showNotification('No video to grade! 🎨', 'error');
        return;
    }

    const filters = [
        'contrast(1.2) saturate(1.3)',
        'sepia(0.3) contrast(1.1)',
        'grayscale(1)',
        'hue-rotate(90deg)',
        'none'
    ];

    // Cycle through filters
    const currentFilter = video.style.filter || 'none';
    const nextIndex = (filters.indexOf(currentFilter) + 1) % filters.length;
    video.style.filter = filters[nextIndex];

    showNotification(`Applied Color Grade: ${nextIndex === filters.length - 1 ? 'Original' : 'Cinematic ' + (nextIndex + 1)} 🎨`, 'success');
}

function synthesizeVoice() {
    if (!('speechSynthesis' in window)) {
        showNotification('Voice synthesis not supported in this browser 😢', 'error');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const text = "AI Video Studio voice generation active. Creating professional voiceover.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
    showNotification('Generating AI Voiceover... 🎙️', 'success');
}

function simulateProcessing(message) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 4000;
        display: flex; align-items: center; justify-content: center;
        flex-direction: column;
    `;

    modal.innerHTML = `
        <div class="glass-card" style="padding: 2rem; text-align: center; max-width: 400px;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
            <h3 style="margin-bottom: 1rem;">AI Processing</h3>
            <p style="margin-bottom: 1.5rem; color: var(--color-text-secondary);">${message}</p>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div id="progress-bar" style="width: 0%; height: 100%; background: var(--color-accent-purple); transition: width 0.2s;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;

        const bar = modal.querySelector('#progress-bar');
        if (bar) bar.style.width = `${progress}%`;

        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.body.removeChild(modal);
                showNotification('AI Processing Complete! ✨', 'success');
            }, 500);
        }
    }, 200);
}

// ===================================
// PROJECTS
// ===================================

async function loadUserProjects() {
    try {
        const response = await fetch('/api/projects', {
            credentials: 'include'
        });

        if (response.ok) {
            const projects = await response.json();
            console.log('Loaded projects:', projects);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function saveProject() {
    if (!state.isAuthenticated) {
        showNotification('Please login to save projects', 'error');
        return;
    }

    const projectData = {
        name: `Project ${Date.now()}`,
        data: {
            mediaFiles: state.mediaFiles,
            timelineClips: state.timelineClips
        }
    };

    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            showNotification('Project saved! 💾', 'success');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        return;
    }

    // Export with effects using canvas
    exportVideoWithEffects(video);
}

function exportVideo() {
    const videoClips = getVideoClips();

    // Check if we have multiple videos to combine
    if (videoClips.length > 1) {
        exportCombinedVideos(videoClips);
        return;
    }

    // Single video export
    const video = document.querySelector('.preview-screen video');
    if (!video || !video.src) {
        showNotification('No video to export! 📁', 'error');
        return;
    }

    // Check if video has any effects applied
    const hasEffects = video.style.filter || video.style.transform ||
        document.querySelectorAll('.preview-screen div[contenteditable]').length > 0;

    if (!hasEffects) {
        // No effects applied, just download original
        exportOriginalVideo(video);
        return;
    }

    // Export with effects using canvas
    exportVideoWithEffects(video);
}

async function exportCombinedVideos(videoClips) {
    showNotification(`Preparing to export ${videoClips.length} combined videos... ⏳`, 'info');

    // For now, download each video separately
    // Full implementation would require server-side encoding
    for (let i = 0; i < videoClips.length; i++) {
        const clip = videoClips[i];
        const file = state.mediaFiles.find(f => f.id === clip.fileId);

        if (file) {
            const a = document.createElement('a');
            a.href = file.url;
            a.download = `combined-part-${i + 1}-${file.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
        }
    }

    showNotification('All video parts exported! You can combine them using video editing software. 💾', 'success');
}

function exportOriginalVideo(video) {
    const a = document.createElement('a');
    a.href = video.src;

    let filename = `exported-video-${Date.now()}.mp4`;
    if (state.currentPreviewFile && state.currentPreviewFile.name) {
        filename = `exported-${state.currentPreviewFile.name}`;
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotification('Exporting video... 💾', 'success');
}

async function exportVideoWithEffects(video) {
    showNotification('Processing video with effects... ⏳', 'info');

    try {
        // Create canvas to capture video with effects
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to video size
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;

        // Create MediaRecorder to record canvas
        const stream = canvas.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 5000000 // 5 Mbps
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `exported-with-effects-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
            showNotification('Export complete! 🎉', 'success');
        };

        // Start recording
        mediaRecorder.start();

        // Reset video to beginning
        video.currentTime = 0;

        // Function to draw frame with effects
        const drawFrame = () => {
            if (video.paused || video.ended) {
                mediaRecorder.stop();
                return;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Save context state
            ctx.save();

            // Apply transformations (zoom, position)
            const transform = video.style.transform;
            if (transform) {
                const scaleMatch = transform.match(/scale\(([^)]+)\)/);
                const translateXMatch = transform.match(/translateX\(([^)]+)\)/);
                const translateYMatch = transform.match(/translateY\(([^)]+)\)/);

                if (scaleMatch) {
                    const scale = parseFloat(scaleMatch[1]);
                    ctx.scale(scale, scale);
                }
                if (translateXMatch) {
                    const x = parseFloat(translateXMatch[1]);
                    ctx.translate(x, 0);
                }
                if (translateYMatch) {
                    const y = parseFloat(translateYMatch[1]);
                    ctx.translate(0, y);
                }
            }

            // Apply opacity
            if (video.style.opacity) {
                ctx.globalAlpha = parseFloat(video.style.opacity);
            }

            // Draw video frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Apply CSS filters to canvas
            if (video.style.filter) {
                ctx.filter = video.style.filter;
            }

            // Restore context
            ctx.restore();

            // Draw text overlays
            const textOverlays = document.querySelectorAll('.preview-screen div[contenteditable]');
            textOverlays.forEach(textEl => {
                const text = textEl.textContent;
                const fontSize = parseFloat(window.getComputedStyle(textEl).fontSize);
                const color = window.getComputedStyle(textEl).color;

                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.fillText(text, canvas.width / 2, canvas.height / 2);
            });

            requestAnimationFrame(drawFrame);
        };

        // Play video and start drawing frames
        video.play();
        drawFrame();

    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed. Downloading original video instead.', 'error');
        exportOriginalVideo(video);
    }
}

function shareProject() {
    const projectUrl = window.location.href;

    // Try to use the Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'Check out my video project!',
            text: 'I created this amazing video with AI Video Studio',
            url: projectUrl
        }).then(() => {
            showNotification('Project shared! 🎉', 'success');
        }).catch(() => {
            // Fallback to clipboard
            copyToClipboard(projectUrl);
        });
    } else {
        // Fallback to clipboard
        copyToClipboard(projectUrl);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copied to clipboard! 📋', 'success');
        }).catch(() => {
            showNotification('Failed to copy link', 'error');
        });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Link copied to clipboard! 📋', 'success');
    }
}

function applyVoiceEffect() {
    const preset = document.getElementById('voicePreset')?.value;
    const pitch = document.getElementById('pitchSlider')?.value || 0;

    if (!preset || preset === 'none') {
        showNotification('Please select a voice preset', 'error');
        return;
    }

    const video = document.querySelector('.preview-screen video');
    if (!video) {
        showNotification('No video to apply effects to', 'error');
        return;
    }

    // Apply playback rate based on preset
    const presetSettings = {
        'radio': { rate: 1.0, description: 'Radio Voice' },
        'robot': { rate: 0.9, description: 'Robot Voice' },
        'deep': { rate: 0.8, description: 'Deep Voice' }
    };

    const settings = presetSettings[preset];
    if (settings) {
        video.playbackRate = settings.rate;

        // Apply pitch effect using playback rate
        // Positive pitch = faster, Negative pitch = slower
        const pitchFactor = 1 + (parseFloat(pitch) * 0.05); // 5% per pitch step
        video.playbackRate = settings.rate * pitchFactor;

        // Preserve pitch (this requires Web Audio API for real pitch shifting)
        if (video.preservesPitch !== undefined) {
            video.preservesPitch = false; // Allow pitch change with speed
        } else if (video.mozPreservesPitch !== undefined) {
            video.mozPreservesPitch = false;
        } else if (video.webkitPreservesPitch !== undefined) {
            video.webkitPreservesPitch = false;
        }

        showNotification(
            `Applied ${settings.description}! Playback rate: ${video.playbackRate.toFixed(2)}x 🎙️`,
            'success'
        );
    } else {
        showNotification(`Applied ${preset} effect with pitch ${pitch} 🎙️`, 'success');
    }
}

// ===================================
// ANIMATIONS & EFFECTS
// ===================================

function setupAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

function scrollToEditor() {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.scrollIntoView({ behavior: 'smooth' });
    }
}

function setupHomePageButtons() {
    // Watch Demo, Get Started, Start Free Trial, Contact Sales buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        const text = btn.textContent.trim();

        if (text === 'Watch Demo') {
            btn.onclick = () => {
                showNotification('Demo video coming soon! 🎬', 'info');
            };
        }

        if (text === 'Get Started') {
            btn.onclick = () => {
                const signupModal = document.getElementById('signupModal');
                if (signupModal) {
                    openModal(signupModal);
                } else {
                    showNotification('Please sign up to get started! 🚀', 'info');
                }
            };
        }

        if (text === 'Start Free Trial') {
            btn.onclick = () => {
                const signupModal = document.getElementById('signupModal');
                if (signupModal) {
                    openModal(signupModal);
                } else {
                    showNotification('Sign up to start your free trial! 🎉', 'info');
                }
            };
        }

        if (text === 'Contact Sales') {
            btn.onclick = () => {
                const email = 'sales@aivideostudio.com';
                const subject = 'Enterprise Inquiry';
                const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
                window.location.href = mailtoLink;
                showNotification('Opening email client... 📧', 'info');
            };
        }
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
            type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                'linear-gradient(135deg, #3b82f6, #2563eb)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        max-width: 300px;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===================================
// UTILITIES
// ===================================

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export for debugging
window.appState = state;
window.saveProject = saveProject;

// ===================================
// VOICE EFFECTS & FILTERS
// ===================================

function setupVoiceEffects() {
    // Voice preset selector
    const voicePreset = document.getElementById('voicePreset');
    if (voicePreset) {
        voicePreset.addEventListener('change', (e) => {
            applyVoicePreset(e.target.value);
        });
    }

    // Pitch slider
    const pitchSlider = document.getElementById('pitchSlider');
    const pitchValue = document.getElementById('pitchValue');
    if (pitchSlider && pitchValue) {
        pitchSlider.addEventListener('input', (e) => {
            pitchValue.textContent = e.target.value;
        });
    }

    // Speed slider
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
            speedValue.textContent = `${e.target.value}x`;
        });
    }

    // Reverb slider
    const reverbSlider = document.getElementById('reverbSlider');
    const reverbValue = document.getElementById('reverbValue');
    if (reverbSlider && reverbValue) {
        reverbSlider.addEventListener('input', (e) => {
            reverbValue.textContent = `${e.target.value}%`;
        });
    }

    // Echo slider
    const echoSlider = document.getElementById('echoSlider');
    const echoValue = document.getElementById('echoValue');
    if (echoSlider && echoValue) {
        echoSlider.addEventListener('input', (e) => {
            echoValue.textContent = `${e.target.value}%`;
        });
    }

    // Apply voice effects button
    const applyVoiceEffects = document.getElementById('applyVoiceEffects');
    if (applyVoiceEffects) {
        applyVoiceEffects.addEventListener('click', () => {
            const settings = {
                pitch: pitchSlider?.value || 0,
                speed: speedSlider?.value || 1.0,
                reverb: reverbSlider?.value || 0,
                echo: echoSlider?.value || 0
            };
            showNotification(`🎙️ Voice effects applied! Pitch: ${settings.pitch}, Speed: ${settings.speed}x`, 'success');
        });
    }

    // Equalizer toggle
    const eqToggle = document.getElementById('eqToggle');
    const eqControls = document.getElementById('eqControls');
    if (eqToggle && eqControls) {
        eqToggle.addEventListener('change', (e) => {
            eqControls.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    // Compressor toggle
    const compressorToggle = document.getElementById('compressorToggle');
    const compressorControls = document.getElementById('compressorControls');
    const compressorSlider = document.getElementById('compressorSlider');
    const compressorValue = document.getElementById('compressorValue');

    if (compressorToggle && compressorControls) {
        compressorToggle.addEventListener('change', (e) => {
            compressorControls.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    if (compressorSlider && compressorValue) {
        compressorSlider.addEventListener('input', (e) => {
            compressorValue.textContent = `${e.target.value}dB`;
        });
    }

    // Apply filters button
    const applyFilters = document.getElementById('applyFilters');
    if (applyFilters) {
        applyFilters.addEventListener('click', () => {
            const filters = [];
            if (document.getElementById('eqToggle')?.checked) filters.push('Equalizer');
            if (document.getElementById('noiseReduction')?.checked) filters.push('Noise Reduction');
            if (document.getElementById('bassBoost')?.checked) filters.push('Bass Boost');
            if (document.getElementById('vocalEnhancer')?.checked) filters.push('Vocal Enhancer');
            if (document.getElementById('compressorToggle')?.checked) filters.push('Compressor');

            if (filters.length > 0) {
                showNotification(`🎚️ Applied filters: ${filters.join(', ')}`, 'success');
            } else {
                showNotification('No filters selected', 'info');
            }
        });
    }
}

function applyVoicePreset(preset) {
    const pitchSlider = document.getElementById('pitchSlider');
    const speedSlider = document.getElementById('speedSlider');
    const reverbSlider = document.getElementById('reverbSlider');
    const echoSlider = document.getElementById('echoSlider');

    const presets = {
        'radio': { pitch: 2, speed: 1.0, reverb: 15, echo: 5 },
        'robot': { pitch: -8, speed: 0.9, reverb: 30, echo: 20 },
        'chipmunk': { pitch: 8, speed: 1.3, reverb: 0, echo: 0 },
        'deep': { pitch: -6, speed: 0.8, reverb: 10, echo: 0 },
        'echo': { pitch: 0, speed: 1.0, reverb: 40, echo: 60 },
        'telephone': { pitch: 3, speed: 1.0, reverb: 5, echo: 0 },
        'stadium': { pitch: 0, speed: 1.0, reverb: 80, echo: 40 }
    };

    if (preset !== 'none' && presets[preset]) {
        const settings = presets[preset];
        if (pitchSlider) {
            pitchSlider.value = settings.pitch;
            document.getElementById('pitchValue').textContent = settings.pitch;
        }
        if (speedSlider) {
            speedSlider.value = settings.speed;
            document.getElementById('speedValue').textContent = `${settings.speed}x`;
        }
        if (reverbSlider) {
            reverbSlider.value = settings.reverb;
            document.getElementById('reverbValue').textContent = `${settings.reverb}%`;
        }
        if (echoSlider) {
            echoSlider.value = settings.echo;
            document.getElementById('echoValue').textContent = `${settings.echo}%`;
        }
        showNotification(`🎙️ Applied ${preset} preset!`, 'success');
    }
}

// Initialize voice effects when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupVoiceEffects();
});


function loadUserProjects() {
    console.log('Loading user projects...');
    // In demo mode, we could load from localStorage or show dummy projects
    if (isDemoMode) {
        console.log('Demo mode: No backend projects to load');
    }
}
