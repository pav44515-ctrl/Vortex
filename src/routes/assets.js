const express = require('express');
const router = express.Router();

// Mock asset databases
const mockAssets = {
    templates: [
        { id: 1, name: 'Modern Intro', category: 'Intros', thumbnail: 'template1.jpg' },
        { id: 2, name: 'Corporate Presentation', category: 'Business', thumbnail: 'template2.jpg' },
        { id: 3, name: 'Social Media Promo', category: 'Marketing', thumbnail: 'template3.jpg' }
    ],
    effects: [
        { id: 1, name: 'Blur', category: 'Basic', icon: '🌫️' },
        { id: 2, name: 'Glow', category: 'Light', icon: '✨' },
        { id: 3, name: 'Film Grain', category: 'Vintage', icon: '📽️' }
    ],
    transitions: [
        { id: 1, name: 'Fade', duration: '0.5s', icon: '🌅' },
        { id: 2, name: 'Slide', duration: '0.7s', icon: '➡️' },
        { id: 3, name: 'Zoom', duration: '0.6s', icon: '🔍' }
    ],
    stickers: [
        { id: 1, name: 'Emoji Pack', count: 50, icon: '😊' },
        { id: 2, name: 'Arrows & Shapes', count: 30, icon: '▶️' },
        { id: 3, name: 'Social Icons', count: 25, icon: '📱' }
    ],
    fonts: [
        { id: 1, name: 'Roboto', style: 'Sans-serif' },
        { id: 2, name: 'Open Sans', style: 'Sans-serif' },
        { id: 3, name: 'Montserrat', style: 'Sans-serif' },
        { id: 4, name: 'Playfair Display', style: 'Serif' }
    ],
    music: [
        { id: 1, title: 'Upbeat Corporate', duration: '2:30', genre: 'Corporate', mood: 'Upbeat' },
        { id: 2, title: 'Cinematic Epic', duration: '3:15', genre: 'Cinematic', mood: 'Dramatic' },
        { id: 3, title: 'Chill Lo-fi', duration: '2:45', genre: 'Lo-fi', mood: 'Calm' }
    ]
};

// Get Templates
router.get('/templates', (req, res) => {
    res.json({
        success: true,
        count: mockAssets.templates.length,
        items: mockAssets.templates
    });
});

// Get Effects
router.get('/effects', (req, res) => {
    res.json({
        success: true,
        count: mockAssets.effects.length,
        items: mockAssets.effects
    });
});

// Get Transitions
router.get('/transitions', (req, res) => {
    res.json({
        success: true,
        count: mockAssets.transitions.length,
        items: mockAssets.transitions
    });
});

// Get Stickers
router.get('/stickers', (req, res) => {
    res.json({
        success: true,
        count: mockAssets.stickers.length,
        items: mockAssets.stickers
    });
});

// Get Fonts
router.get('/fonts', (req, res) => {
    res.json({
        success: true,
        count: mockAssets.fonts.length,
        items: mockAssets.fonts
    });
});

// Get Music & SFX
router.get('/music', (req, res) => {
    res.json({
        success: true,
        count: mockAssets.music.length,
        items: mockAssets.music
    });
});

module.exports = router;
