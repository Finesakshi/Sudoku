# PokéSudoku 🏆⚡

A clean, modern, and soothing Pokémon-themed Sudoku game designed for an interactive, ad-free experience on both laptops and mobile devices. 

Train your brain, defeat Gym puzzles, collect badges, customize your partner Pokémon avatar, and climb the ranks from a Novice Trainer to a Pokémon Master!

---

## 🌟 Key Features

*   **5 Difficulty Levels & Progression Locks**:
    *   *Simple*: 48 clues. Perfect for beginner trainers.
    *   *Medium*: 40 clues. Standard gym battle.
    *   *Hard*: 32 clues. Advanced strategy.
    *   *Expert* (🔒 Locked): Requires completing **5 Hard games** to unlock.
    *   *Master* (🔒 Locked): Requires completing **10 Expert games** to unlock (features 17 clues, the mathematical minimum for a unique solution).
*   **Gym Badge Cabinet**:
    *   Earn up to **9 unique badges** based on your milestones (e.g. Boulder Badge for Simple, Cascade for Medium, Thunder for Hard, plus special achievements like solving a puzzle in under 5 minutes or finishing with 0 mistakes!).
*   **Sleek, Soothing Light Theme**:
    *   Clean white-screen layout with an elegant off-white gradient.
    *   Delicate, low-contrast gridlines (0.5px cell borders and 1.5px block boundaries) for a modern, clutter-free board.
    *   Clean typography utilizing Google Fonts **Inter** and **Plus Jakarta Sans** with lightweight font styles.
*   **Smart Tutor Hints (No Auto-Fill)**:
    *   Stuck on a number? Click **Hint** to scan the board. It will identify the easiest cell that can be logically solved and display a popup explaining the exact rule (e.g., *Naked Singles* or *Hidden Singles*) and **how the number was derived**. 
    *   It highlights the cell on the board but **does not fill it for you**, letting you learn and enter the digit yourself!
*   **Player Profile customization**:
    *   Select your trainer name and pair up with one of six cute, cartoonish starter avatars (Pikachu, Eevee, Charmander, Bulbasaur, Squirtle, Snorlax).
*   **Fully Responsive & Offline Persistent**:
    *   Scales perfectly down to 320px width (e.g. iPhone SE) with a custom touch-friendly numpad.
    *   Saves your username, avatar, completed wins, and unlocked badges directly to the browser's `localStorage` so you can close the tab and resume anytime.
*   **Professor Oak's Developer Console**:
    *   A hidden cheats menu (accessed via the gear `⚙️` in the bottom-right corner) lets you simulate wins, unlock all badges, or reset stats instantly to test and verify the unlocking mechanics.

---

## 🛠️ Technology Stack

To ensure instant loading times, zero dependencies, and compatibility out of the box, the app is built on a pure client-side stack:
*   **HTML5**: Structure and semantic layout.
*   **CSS3 (Vanilla)**: Grid layout, custom variables (themes), transitions, and CSS shapes.
*   **ES6 Javascript (Vanilla)**: A lightweight, custom state-driven engine and backtracking solver.

---

## 🚀 How to Run the Project Locally

No installation or build steps are required. 
1. Download or clone this repository.
2. Double-click `index.html` to open and play the game instantly in any browser!

---

## 🌐 How to Deploy to GitHub Pages (Ad-Free Hosting)

Host the game online for free to play it on your phone or share it with friends:

1. **Create a Repository**:
   - Go to [github.com](https://github.com/) and create a new repository named `pokemon-sudoku`.
   - Make sure to set it to **Public**.
2. **Upload Files**:
   - Click **uploading an existing file** on the repository landing page.
   - Drag and drop all files and folders from this folder:
     - `index.html`
     - `styles.css`
     - `sudoku.js`
     - `app.js`
     - `assets/` (containing the Pokémon png images)
   - Scroll down and click **Commit changes**.
3. **Enable GitHub Pages**:
   - In your GitHub repository, click on the **Settings** tab (the gear icon on top).
   - In the left menu, select **Pages** (under *Code and automation*).
   - Under **Build and deployment** -> **Source** (Deploy from a branch):
     - Click the **Branch** dropdown (currently showing "None") and select **main**.
     - Keep the directory as `/ (root)`.
     - Click **Save**.
4. **Play on Phone**:
   - Open that URL on your phone's browser. It works offline and saves your progress locally on your phone!
