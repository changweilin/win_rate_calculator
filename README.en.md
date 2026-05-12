# 1v1 Win Rate Calculator

## 1. Title & Description

This project is a 1v1 battle outcome simulator with two working modes:

1. Desktop version: `win_rate_calculator.py` with a Tkinter GUI and Matplotlib charts
2. Web version: `index.html`, `app.js`, and `styles.css`

Both versions estimate:

1. average win rate
2. expected total score
3. score and win-rate volatility (standard deviation)
4. `+3σ` and `-3σ` confidence-like bounds
5. distribution and trend charts (web version)

The repository also includes a GitHub Pages workflow for static site deployment.

## 2. Features

1. Parameterized probability model:
   - total games
   - draw ratio
   - win / lose / draw scores
   - deck strength and impact
   - player skill strength and impact
2. Real-time result output:
   - average win rate
   - average total score
   - average score per game
   - standard deviations
   - ±3σ bounds
3. Visualization:
   - desktop: Matplotlib chart area
   - web: custom CDF charts and score trend chart
4. Input validation and warning messages (for example, percentage inputs must be between 0 and 100, game count must be > 0)
5. Impact auto-scaling:
   - when deck + skill impact is too large for the non-draw probability, values are scaled down safely and a warning is shown
6. Streak-based score model (web):
   - supports win streak bonus and cap in trend/statistical calculation
7. Better UX:
   - light/dark theme toggle
   - responsive layout
   - automatic recalculation on input change
8. Deploy-ready:
   - GitHub Pages workflow included at `.github/workflows/deploy-pages.yml`

## 3. Prerequisites & Installation

### Desktop (Python)

1. Install Python 3.9+ (recommended 3.10+)
2. Create and activate a virtual environment (recommended)
3. Install dependencies (`numpy`, `scipy`, `matplotlib`)

```bash
cd C:\Users\user\Documents\Python\win_rate_calculator\win_rate_calculator
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Web Version

1. Any modern browser is enough (Chrome / Edge / Firefox)
2. If needed, run a local HTTP server to avoid file-protocol limitations

```bash
cd C:\Users\user\Documents\Python\win_rate_calculator\win_rate_calculator
python -m http.server 8080
```

## 4. Quick Start / Usage

### A. Run the Python desktop app

1. Install dependencies as above.
2. Start the app:

```bash
python win_rate_calculator.py
```

3. Fill inputs:

1. `N` (number of games), must be an integer > 0
2. draw ratio (0 ~ 100)
3. win score, lose score, draw score
4. deck strength / deck impact
5. skill strength / skill impact

4. Click calculate to view:

1. average win rate and total score
2. ±3σ win rate / score range
3. distribution plots

### B. Run the web app

1. Start a local server:

```bash
python -m http.server 8080
```

2. Open: `http://127.0.0.1:8080/index.html`
3. Edit inputs and observe updates in real time, including:

1. probability summary (win/loss/draw)
2. average score and per-game score
3. Win-rate CDF chart
4. Score CDF chart
5. score trend line with and without streak bonus effect

### C. Deploy to GitHub Pages

1. Push changes to `main` or `master`
2. In repository settings, open **Settings > Pages**
3. Set **Build and deployment** source to `GitHub Actions`
4. The workflow in `.github/workflows/deploy-pages.yml` will publish automatically

## 5. Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── docs/
│   └── screenshots/
│       ├── win-rate-desktop.png
│       ├── win-rate-mobile-summary.png
│       ├── win-rate-mobile-parameters.png
│       └── win-rate-mobile-results.png
├── app.js
├── index.html
├── styles.css
├── win_rate_calculator.py
├── requirements.txt
└── README.md
```

### Core files

1. `win_rate_calculator.py`: Tkinter desktop app, input parsing, model computation, charts
2. `index.html`: web page structure, form, and result containers
3. `app.js`: web app logic (calculation engine, input validation, rendering, charts, theme switch)
4. `styles.css`: design system and responsive style variables
5. `requirements.txt`: Python dependencies
6. `.github/workflows/deploy-pages.yml`: GitHub Pages deployment configuration
7. `docs/screenshots/*`: screenshots used in documentation

## 6. License

This project is intended to use the **MIT License**.

If you want to fully apply this license, add a `LICENSE` file with the following standard text:

```text
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

You can link this from `README.md` or keep it only in `README.en.md` as needed.
