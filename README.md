# 🎬 AI Video Studio

A premium, web-based video editing platform powered by AI.

![AI Video Studio](public/images/hero-bg.jpg)

## ✨ Features

*   **Professional Video Editor**: Full timeline editing with multi-track support (Video & Audio).
*   **AI-Powered Tools**:
    *   **Auto Edit**: Automatically trim and arrange clips.
    *   **Magic Cut**: Remove silence and bad takes instantly.
    *   **AI Voiceover**: Generate professional voiceovers from text.
    *   **Smart Color**: Auto-color grading and correction.
*   **Media Persistence**: Uploaded media is saved to the server and linked to your projects in the database.
*   **Project Management**: Create, save, and manage multiple projects via a dashboard.
*   **Modern UI**: Sleek, dark-themed interface with glassmorphism design.

## 🛠️ Tech Stack

*   **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
*   **Backend**: Node.js, Express.js
*   **Database**: SQLite (for user data and project metadata)
*   **Storage**: Local file system (for media uploads)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v14 or higher)
*   npm (Node Package Manager)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/ai-video-studio.git
    cd ai-video-studio
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the server**
    ```bash
    npm start
    ```

4.  **Open in Browser**
    Navigate to `http://localhost:3000`

## 📁 Project Structure

*   `public/`: Static frontend files (HTML, CSS, JS)
    *   `editor.html`: Main video editor interface
    *   `dashboard.html`: Project management dashboard
    *   `uploads/`: Directory for user-uploaded media
*   `src/`: Backend source code
    *   `server.js`: Main Express server entry point
    *   `routes/`: API routes (auth, projects, upload)
    *   `config/`: Database configuration
*   `data/`: SQLite database file (`video-studio.db`)

## 🔒 Authentication

The application includes a built-in authentication system (Signup/Login) using sessions.
*   **Demo Mode**: You can use the app in "Demo Mode" without a backend, but data will only be saved to `localStorage`.
*   **Full Mode**: Sign up to enable database storage and persistent media uploads.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
