// ===================================
// Vertex - MAIN APPLICATION
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

// Check if running in demo mode (GitHub Pages only - not localhost)
const isDemoMode = window.location.hostname.includes('github.io') ||
    window.location.hostname === 'pav44515-ctrl.github.io';

// Debug logging
function logDebug(message, data = null) {
    if (data) {
        console.log(`[DEBUG] ${message}`, data);
    } else {
        console.log(`[DEBUG] ${message}`);
    }
}

window.addEventListener('beforeunload', () => {
    const projects = JSON.parse(localStorage.getItem('user_projects') || '[]');
    console.log('BEFORE UNLOAD - Projects:', projects);
    if (projects.length > 0) {
        console.log('BEFORE UNLOAD - First Project Name:', projects[0].name);
    }
});

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Vortex initialized');
    checkAuthentication();
    setupEventListeners();

    // Only initialize editor if we are on the editor page
    if (document.getElementById('editor')) {
        initializeEditor();
        setupVoiceEffects();
    }

    setupAnimations();

    // Initialize Dashboard if on dashboard page
    if (document.getElementById('projectsGrid')) {
        initializeDashboard();
    }

    // Global listener for New Project button
    const createBtn = document.getElementById('createNewProjectBtn');
    if (createBtn) {
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            createNewProject();
        });
    }

    // Global listener for Clear Data button
    const clearBtn = document.getElementById('clearDataBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            if (confirm('Clear all local data? This cannot be undone.')) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
            }
        });
    }
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

function setupEditorListeners() {
    // Media import - get reference to the file input
    const fileInput = setupMediaImport();

    // Header Import Media button - wire to directly trigger file input
    const headerImportBtn = document.getElementById('importMediaBtn');
    if (headerImportBtn && fileInput) {
        headerImportBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // Play/Pause button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            const video = document.querySelector('.preview-screen video');
            if (video) {
                if (video.paused) {
                    video.play();
                    playBtn.textContent = '⏸️ Pause';
                } else {
                    video.pause();
                    playBtn.textContent = '▶️ Play';
                }
            }
        });
    }

    // Stop button
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            const video = document.querySelector('.preview-screen video');
            if (video) {
                video.pause();
                video.currentTime = 0;
                const playBtn = document.getElementById('playBtn');
                if (playBtn) playBtn.textContent = '▶️ Play';
            }
        });
    }
}

function renderTimeline() {
    // Clear existing clips
    const tracks = document.querySelectorAll('.timeline-track');
    tracks.forEach(track => {
        track.innerHTML = '';
    });

    // Re-render all clips
    state.timelineClips.forEach(clip => {
        renderTimelineClip(clip);
    });
}


function setupMediaImport() {
    const importBtn = document.getElementById('mediaLibraryUpload');
    if (!importBtn) return null;

    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,audio/*,image/*';
    input.multiple = true;
    input.style.display = 'none';
    input.id = 'hiddenFileInput'; // Add ID for debugging
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

    // Return the input so other buttons can trigger it
    return input;
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
                window.location.href = 'dashboard.html';
            } else {
                openModal(loginModal);
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

    // Demo Video Modal
    const watchDemoBtn = document.getElementById('watchDemoBtn');
    const demoVideoModal = document.getElementById('demoVideoModal');
    const closeDemoModal = document.getElementById('closeDemoModal');

    if (watchDemoBtn && demoVideoModal) {
        watchDemoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(demoVideoModal);
        });
    }

    if (closeDemoModal && demoVideoModal) {
        closeDemoModal.addEventListener('click', () => closeModal(demoVideoModal));
    }

    if (demoVideoModal) {
        demoVideoModal.addEventListener('click', (e) => {
            if (e.target === demoVideoModal) {
                closeModal(demoVideoModal);
            }
        });
    }

    // Profile Settings Modal
    const userProfile = document.getElementById('userProfile');
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const profileForm = document.getElementById('profileForm');

    if (userProfile && profileModal) {
        userProfile.addEventListener('click', () => {
            if (state.isAuthenticated && state.user) {
                // Populate form with current user data
                document.getElementById('profileName').value = state.user.name;
                document.getElementById('profileEmail').value = state.user.email;
                openModal(profileModal);
            }
        });
        userProfile.style.cursor = 'pointer';
    }

    if (closeProfileModal && profileModal) {
        closeProfileModal.addEventListener('click', () => closeModal(profileModal));
    }

    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                closeModal(profileModal);
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = document.getElementById('profileName').value;

            if (isDemoMode) {
                // Update demo user
                state.user.name = newName;
                localStorage.setItem('demo_user', JSON.stringify(state.user));
                updateUIForAuthenticatedUser();
                closeModal(profileModal);
                showNotification('Profile updated! 🎉', 'success');
            } else {
                // Update via backend API
                try {
                    const response = await fetch('/api/user/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ name: newName })
                    });

                    if (response.ok) {
                        state.user.name = newName;
                        updateUIForAuthenticatedUser();
                        closeModal(profileModal);
                        showNotification('Profile updated! 🎉', 'success');
                    } else {
                        showNotification('Failed to update profile', 'error');
                    }
                } catch (error) {
                    console.error('Profile update error:', error);
                    showNotification('Update failed. Please try again.', 'error');
                }
            }
        });
    }
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
        // Extract name from email (before @)
        const userName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
        const fakeUser = { id: 'demo-123', name: userName, email: email };
        state.isAuthenticated = true;
        state.user = fakeUser;
        localStorage.setItem('demo_user', JSON.stringify(fakeUser));
        localStorage.setItem('userSession', JSON.stringify(fakeUser));

        updateUIForAuthenticatedUser();
        closeModal(document.getElementById('loginModal'));
        showNotification('Welcome back! (Demo Mode) 🎉', 'success');

        // Redirect to dashboard after login
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
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
            localStorage.setItem('userSession', JSON.stringify(data.user));
            updateUIForAuthenticatedUser();
            closeModal(document.getElementById('loginModal'));
            showNotification('Welcome back! 🎉', 'success');

            // Redirect to dashboard after login
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
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
        // Use the actual name entered by user
        const fakeUser = { id: 'demo-123', name: name, email: email };
        state.isAuthenticated = true;
        state.user = fakeUser;
        localStorage.setItem('demo_user', JSON.stringify(fakeUser));
        localStorage.setItem('userSession', JSON.stringify(fakeUser));

        updateUIForAuthenticatedUser();
        closeModal(document.getElementById('signupModal'));
        showNotification('Account created! (Demo Mode) 🎉', 'success');

        // Redirect to dashboard after signup
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
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
            localStorage.setItem('userSession', JSON.stringify(data.user));
            updateUIForAuthenticatedUser();
            closeModal(document.getElementById('signupModal'));
            showNotification('Account created successfully! 🎉', 'success');

            // Redirect to dashboard after signup
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
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

async function loadProjectFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');

    if (projectId) {
        logDebug(`Loading project from URL: ${projectId}`);

        // Try to load from backend first
        try {
            const response = await fetch('/api/projects', { credentials: 'include' });
            if (response.ok) {
                const projects = await response.json();
                const project = projects.find(p => p.id == projectId);
                if (project) {
                    const projectData = typeof project.data === 'string' ? JSON.parse(project.data) : project.data;
                    state.currentProject = project;
                    state.mediaFiles = projectData.mediaFiles || [];
                    state.timelineClips = projectData.timelineClips || [];

                    const titleInput = document.getElementById('projectTitleInput');
                    if (titleInput) titleInput.value = project.name;

                    // Clear existing
                    const mediaLibrary = document.getElementById('mediaLibrary');
                    if (mediaLibrary) mediaLibrary.innerHTML = '';

                    state.mediaFiles.forEach(file => addMediaToLibrary(file));
                    renderTimeline();
                    showNotification('Project loaded from database! 📂', 'success');
                    return;
                }
            }
        } catch (e) {
            console.error("Backend load failed", e);
        }

        // Try to load from local storage first (for demo/local mode)
        let projects = JSON.parse(localStorage.getItem('user_projects') || '[]');

        // Check session storage backup
        const sessionProjects = JSON.parse(sessionStorage.getItem('user_projects') || '[]');

        logDebug(`Found ${projects.length} projects in localStorage`);
        logDebug(`Found ${sessionProjects.length} projects in sessionStorage`);

        let project = projects.find(p => p.id === projectId);
        const sessionProject = sessionProjects.find(p => p.id === projectId);

        // Use session project if it's newer
        if (sessionProject) {
            if (!project || new Date(sessionProject.modified) > new Date(project.modified)) {
                logDebug('Using newer version from sessionStorage');
                project = sessionProject;
            }
        }

        if (project) {
            state.currentProject = project;
            logDebug('Project loaded successfully:', project.name);
            logDebug('Project ID:', project.id);

            // Update editor UI with project name
            const titleInput = document.getElementById('projectTitleInput');
            if (titleInput) {
                titleInput.value = project.name;
                logDebug('Set title input to:', project.name);

                // Save on change (blur or enter)
                const saveHandler = (e) => {
                    logDebug('Saving project name:', e.target.value);
                    state.currentProject.name = e.target.value;
                    state.currentProject.modified = new Date().toISOString();
                    saveProject();
                    showNotification('Project name saved! 💾', 'success');
                };

                titleInput.addEventListener('blur', saveHandler);
                titleInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        titleInput.blur();
                    }
                });
            }

            // Load media files
            const mediaFiles = project.mediaFiles || (project.data && project.data.mediaFiles) || [];
            if (mediaFiles.length > 0) {
                state.mediaFiles = mediaFiles;
                // Clear existing
                const mediaLibrary = document.getElementById('mediaLibrary');
                if (mediaLibrary) mediaLibrary.innerHTML = '';
                state.mediaFiles.forEach(file => addMediaToLibrary(file));
            }

            // Load clips if any
            const clips = project.clips || project.timelineClips || (project.data && project.data.timelineClips) || [];
            if (clips.length > 0) {
                state.timelineClips = clips;
                renderTimeline();
            }
        } else {
            console.error('Project not found');
            showNotification('Project not found', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
        }
    }
}

function initializeEditor() {
    // Check authentication first
    if (!state.isAuthenticated && !isDemoMode) {
        // Optional: redirect or show login
    }

    // Initialize timeline
    setupTimeline();
    setupPlayhead();

    // Load project if ID is present
    loadProjectFromUrl();

    // Add manual save button
    const headerActions = document.querySelector('header .flex.items-center.gap-4') || document.querySelector('.header-right');
    if (headerActions) {
        // Check if button already exists
        if (!document.getElementById('manualSaveBtn')) {
            const saveBtn = document.createElement('button');
            saveBtn.id = 'manualSaveBtn';
            saveBtn.innerHTML = '💾 Save';
            saveBtn.className = 'px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all flex items-center gap-2';
            saveBtn.onclick = () => {
                saveProject();
                showNotification('Project saved! 💾', 'success');
            };
            headerActions.insertBefore(saveBtn, headerActions.firstChild);
        }
    } else {
        logDebug('Could not find header actions container');
    }
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

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('Upload error:', error);
        return URL.createObjectURL(file); // Fallback
    }
}

async function handleFileDrop(files) {
    showNotification('Uploading media... ⏳', 'info');

    for (const file of Array.from(files)) {
        const url = await uploadFile(file);

        const fileData = {
            id: generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            url: url
        };

        state.mediaFiles.push(fileData);
        addMediaToLibrary(fileData);
        showNotification(`Added ${file.name} 📁`, 'success');

        // Add to timeline if video
        if (fileData.type.startsWith('video/')) {
            addClipToTimeline(fileData, state.timelineClips.length);
        }
    }
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

    const text = "Vortex voice generation active. Creating professional voiceover.";
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

    const titleInput = document.getElementById('projectTitleInput');
    const projectName = titleInput ? titleInput.value : `Project ${Date.now()}`;

    const projectData = {
        name: projectName,
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
            const result = await response.json();
            state.currentProject = { ...projectData, id: result.id };
            showNotification('Project saved to database! 💾', 'success');
        } else {
            const err = await response.json();
            showNotification(err.error || 'Failed to save', 'error');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification('Network error saving project', 'error');
    }
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
            text: 'I created this amazing video with Vortex',
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

// ===================================
// VOICE EFFECTS & FILTERS (WEB AUDIO API)
// ===================================

let audioCtx;
let mediaSource;
let dryGain;
let wetGain;
let delayNode;
let feedbackGain;
let convolverNode;
let filterNode;

function initAudioContext() {
    if (audioCtx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    const video = document.querySelector('.preview-screen video');
    if (!video) return;

    // Create nodes
    try {
        mediaSource = audioCtx.createMediaElementSource(video);
    } catch (e) {
        console.log('Media source already connected or error:', e);
        return; // Already connected
    }

    dryGain = audioCtx.createGain();
    wetGain = audioCtx.createGain();
    delayNode = audioCtx.createDelay(5.0);
    feedbackGain = audioCtx.createGain();
    convolverNode = audioCtx.createConvolver();
    filterNode = audioCtx.createBiquadFilter();

    // Default connections (Dry only initially)
    mediaSource.connect(dryGain);
    dryGain.connect(audioCtx.destination);

    // Effect chain: Source -> Filter -> Delay/Reverb -> WetGain -> Dest
    mediaSource.connect(filterNode);

    // Echo Loop
    filterNode.connect(delayNode);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(wetGain);

    // Reverb (Simple impulse for now, or just parallel to delay)
    // For true reverb we need an impulse response file. 
    // For this demo, we'll simulate reverb with short delay or just use the delay node as "Echo/Reverb" combo
    // Or we can generate a simple noise buffer for reverb

    wetGain.connect(audioCtx.destination);

    // Initialize values
    dryGain.gain.value = 1.0;
    wetGain.gain.value = 0.0;
    feedbackGain.gain.value = 0.0;
    delayNode.delayTime.value = 0.0;
}

function setupVoiceEffects() {
    // Voice preset selector
    const voicePreset = document.getElementById('voicePreset');
    if (voicePreset) {
        voicePreset.addEventListener('change', (e) => {
            applyVoicePreset(e.target.value);
        });
    }

    // Sliders
    const sliders = ['pitch', 'speed', 'reverb', 'echo'];
    sliders.forEach(type => {
        const slider = document.getElementById(`${type}Slider`);
        const valueDisplay = document.getElementById(`${type}Value`);
        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                let val = e.target.value;
                if (type === 'speed') val += 'x';
                else if (type === 'reverb' || type === 'echo') val += '%';
                valueDisplay.textContent = val;
            });
        }
    });

    // Apply button
    const applyBtn = document.getElementById('applyVoiceEffects');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyVoiceEffect);
    }
}

function applyVoicePreset(preset) {
    const pitchSlider = document.getElementById('pitchSlider');
    const speedSlider = document.getElementById('speedSlider');
    const reverbSlider = document.getElementById('reverbSlider');
    const echoSlider = document.getElementById('echoSlider');

    // Default: Reset everything
    let settings = { pitch: 0, speed: 1.0, reverb: 0, echo: 0 };

    const presets = {
        'radio': { pitch: 0, speed: 1.0, reverb: 0, echo: 0, filter: 'highpass' }, // Simulated later
        'robot': { pitch: -5, speed: 1.0, reverb: 20, echo: 30 },
        'chipmunk': { pitch: 8, speed: 1.0, reverb: 0, echo: 0 }, // Pitch handled via playbackRate for now
        'deep': { pitch: -8, speed: 1.0, reverb: 10, echo: 0 },
        'echo': { pitch: 0, speed: 1.0, reverb: 0, echo: 60 },
        'reverb': { pitch: 0, speed: 1.0, reverb: 60, echo: 0 },
        'telephone': { pitch: 0, speed: 1.0, reverb: 0, echo: 0, filter: 'bandpass' },
        'monster': { pitch: -10, speed: 0.8, reverb: 30, echo: 10 } // Monster is slow + deep
    };

    if (presets[preset]) {
        settings = { ...settings, ...presets[preset] };
    }

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

    // Auto-apply when preset changes
    applyVoiceEffect();
}

function applyVoiceEffect() {
    const video = document.querySelector('.preview-screen video');
    if (!video) {
        showNotification('No video to apply effects to', 'error');
        return;
    }

    // Initialize Audio Context on user gesture
    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const pitch = parseFloat(document.getElementById('pitchSlider')?.value || 0);
    const speed = parseFloat(document.getElementById('speedSlider')?.value || 1.0);
    const reverb = parseFloat(document.getElementById('reverbSlider')?.value || 0);
    const echo = parseFloat(document.getElementById('echoSlider')?.value || 0);
    const preset = document.getElementById('voicePreset')?.value;

    // 1. Apply Speed & Pitch (via playbackRate)
    // Note: Browsers couple pitch and speed by default. 
    // To change pitch without speed requires complex DSP.
    // To change speed without pitch requires preservesPitch = true.

    // Logic:
    // If Pitch is 0, just use Speed slider.
    // If Pitch is set, we adjust playbackRate to simulate pitch change.
    // But this also changes speed. 
    // If user wants "Chipmunk" (High Pitch), we increase rate.
    // If user wants "Deep", we decrease rate.

    let finalRate = speed;

    if (pitch !== 0) {
        // Simple pitch simulation: 1 semitone ~= 6% speed change
        const pitchFactor = Math.pow(1.05946, pitch);
        finalRate = speed * pitchFactor;

        // If we are changing pitch, we generally WANT the speed change (chipmunk effect)
        // So we disable pitch preservation
        if (video.preservesPitch !== undefined) video.preservesPitch = false;
        else if (video.mozPreservesPitch !== undefined) video.mozPreservesPitch = false;
        else if (video.webkitPreservesPitch !== undefined) video.webkitPreservesPitch = false;
    } else {
        // If pitch is 0, we just want speed change, usually preserving pitch
        if (video.preservesPitch !== undefined) video.preservesPitch = true;
    }

    video.playbackRate = finalRate;

    // 2. Apply Audio Effects (Echo/Reverb)
    if (audioCtx && wetGain) {
        // Echo Logic
        if (echo > 0) {
            delayNode.delayTime.value = 0.3; // 300ms delay
            feedbackGain.gain.value = Math.min(0.6, echo / 100); // Feedback
            wetGain.gain.value = echo / 100;
        } else if (reverb > 0) {
            // Simulate reverb with short delay
            delayNode.delayTime.value = 0.05; // 50ms delay
            feedbackGain.gain.value = 0.4;
            wetGain.gain.value = reverb / 100;
        } else {
            wetGain.gain.value = 0;
        }

        // Filter Logic (Telephone/Radio)
        if (preset === 'telephone' || preset === 'radio') {
            filterNode.type = 'bandpass';
            filterNode.frequency.value = 1000; // 1kHz center
            filterNode.Q.value = 1.0;
        } else {
            filterNode.type = 'allpass'; // Neutral
        }
    }

    showNotification(`Applied Effects! Rate: ${finalRate.toFixed(2)}x`, 'success');
}

// Initialize voice effects when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupVoiceEffects();
});


function loadUserProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');
    if (!projectsGrid) return;

    const projects = JSON.parse(localStorage.getItem('user_projects') || '[]');

    if (projects.length === 0) {
        projectsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    projectsGrid.style.display = 'grid';
    projectsGrid.innerHTML = '';

    projects.forEach(project => {
        const date = new Date(project.modified).toLocaleDateString();
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-thumbnail">
                ${project.thumbnail ? `<img src="${project.thumbnail}" alt="${project.name}">` : '<div class="placeholder-thumb">🎬</div>'}
                <div class="project-duration">${project.duration || '00:00'}</div>
            </div>
            <div class="project-info">
                <h3 class="project-title">${project.name}</h3>
                <div class="project-meta">
                    <span>Edited ${date}</span>
                    <button class="btn-icon delete-project" data-id="${project.id}" title="Delete">🗑️</button>
                </div>
            </div>
        `;

        // Click to open project
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-project')) {
                window.location.href = `editor.html?project=${project.id}`;
            }
        });

        // Delete button
        const deleteBtn = card.querySelector('.delete-project');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this project?')) {
                    const updatedProjects = projects.filter(p => p.id !== project.id);
                    localStorage.setItem('user_projects', JSON.stringify(updatedProjects));
                    loadUserProjects(); // Reload grid
                }
            });
        }

        projectsGrid.appendChild(card);
    });
}

function initializeDashboard() {
    console.log('Initializing Dashboard...');
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;

    loadUserProjects();

    const createBtn = document.getElementById('createNewProjectBtn');
    if (createBtn) {
        createBtn.addEventListener('click', createNewProject);
    }

    // Add Clear Data button if not exists
    if (!document.getElementById('clearDataBtn')) {
        const header = document.querySelector('.dashboard-header');
        if (header) {
            const clearBtn = document.createElement('button');
            clearBtn.id = 'clearDataBtn';
            clearBtn.className = 'btn btn-secondary';
            clearBtn.style.marginLeft = '10px';
            clearBtn.textContent = '🗑️ Clear Data';
            header.appendChild(clearBtn);
        }
    }

    // Check for voice project intent
    const voiceIntent = localStorage.getItem('voice_project_intent');
    if (voiceIntent) {
        try {
            const intent = JSON.parse(voiceIntent);
            console.log('Found voice intent:', intent);

            // Create the project
            const projectId = 'proj_' + Date.now();
            const newProject = {
                id: projectId,
                name: intent.name || 'New Project',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                thumbnail: null,
                duration: '00:00',
                description: intent.description,
                type: intent.type
            };

            // Save to local storage
            const projects = JSON.parse(localStorage.getItem('user_projects') || '[]');
            projects.unshift(newProject);
            localStorage.setItem('user_projects', JSON.stringify(projects));
            sessionStorage.setItem('user_projects', JSON.stringify(projects));

            // Clear intent
            localStorage.removeItem('voice_project_intent');

            // Show notification
            showNotification(`Created ${intent.type} project from voice! 🎤`, 'success');

            // Redirect to editor after short delay
            setTimeout(() => {
                window.location.href = `editor.html?project=${projectId}`;
            }, 1500);

        } catch (e) {
            console.error('Error processing voice intent:', e);
            localStorage.removeItem('voice_project_intent');
        }
    }
}

function createNewProject() {
    const projectId = 'proj_' + Date.now();
    const newProject = {
        id: projectId,
        name: 'Untitled Project',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        thumbnail: null,
        duration: '00:00'
    };

    // Save to local storage
    const projects = JSON.parse(localStorage.getItem('user_projects') || '[]');
    projects.unshift(newProject);
    localStorage.setItem('user_projects', JSON.stringify(projects));
    sessionStorage.setItem('user_projects', JSON.stringify(projects)); // Backup

    // Redirect to editor
    window.location.href = `editor.html?project=${projectId}`;
}

function saveProject() {
    if (!state.currentProject) {
        logDebug('No current project to save');
        return;
    }

    // Update project data with current state
    state.currentProject.modified = new Date().toISOString();
    state.currentProject.clips = state.timelineClips;
    state.currentProject.mediaFiles = state.mediaFiles;

    logDebug('Saving project ID:', state.currentProject.id);
    logDebug('Saving project Name:', state.currentProject.name);

    // Get all projects from localStorage
    let projects = [];
    try {
        const stored = localStorage.getItem('user_projects');
        projects = stored ? JSON.parse(stored) : [];
        logDebug('Projects in storage BEFORE save:', projects.length);
        if (projects.length > 0) {
            logDebug('First project ID in storage:', projects[0].id);
        }
    } catch (e) {
        logDebug('Error parsing localStorage:', e);
        projects = [];
    }

    // Find and update the current project
    const index = projects.findIndex(p => p.id === state.currentProject.id);
    if (index !== -1) {
        projects[index] = state.currentProject;
        localStorage.setItem('user_projects', JSON.stringify(projects));
        sessionStorage.setItem('user_projects', JSON.stringify(projects)); // Backup
        logDebug('Project updated at index:', index);

        // Verify save
        const verify = JSON.parse(localStorage.getItem('user_projects'));
        logDebug('Projects in storage AFTER save:', verify.length);
        logDebug('Saved project name in storage:', verify[index].name);
    } else {
        logDebug('Project not found in array, pushing new. ID:', state.currentProject.id);
        projects.push(state.currentProject);
        localStorage.setItem('user_projects', JSON.stringify(projects));
        sessionStorage.setItem('user_projects', JSON.stringify(projects)); // Backup

        // Verify save
        const verify = JSON.parse(localStorage.getItem('user_projects'));
        logDebug('Projects in storage AFTER push:', verify.length);
    }
}
