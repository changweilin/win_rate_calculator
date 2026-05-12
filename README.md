# 1v1 對戰勝率計算器（Win Rate Calculator）

## 1. 專案標題與簡介（Title & Description）

本專案是「1v1 對戰勝率」分析工具，提供兩種入口：

1. 桌面版：使用 `win_rate_calculator.py` 建立的 Python Tkinter GUI（含 Matplotlib 圖表）
2. 網頁版：使用 `index.html`、`app.js` 與 `styles.css` 的前端版本

兩個版本都會根據輸入參數，計算：

1. 平均勝率
2. 平均總得分
3. 勝率與總分的標準差
4. `+3σ` / `-3σ` 區間估計
5. 分佈圖與趨勢圖（網頁版）

專案同時保留了舊有的 GitHub Pages 部署流程，能直接以靜態網站方式發佈前端版。

## 2. 核心功能特性（Features）

1. 參數化勝率建模：可設定對戰場次、平手機率、勝/負/平分數、牌組強度與影響力、玩家技術強度與影響力
2. 結果輸出：即時計算平均勝率、總分、每場平均分、標準差與 ±3σ 區間
3. 視覺化：桌面版提供 Matplotlib 畫布、網頁版提供自訂 CDF 與趨勢走勢圖
4. 輸入驗證與告警：防呆邏輯（例如 `%` 欄位需介於 0～100，局數需為正整數）
5. 影響力自動縮放：當牌組與技術加總衝突超過可用機率時，會進行保守縮放並顯示提示
6. 網頁版進階邏輯：支援連勝加成（streak）機制並模擬總分的期望與變異數
7. 介面體驗：網頁版支援明暗主題切換、響應式版面與即時重算
8. 可部署性：內建 GitHub Actions 工作流程可直接發佈到 GitHub Pages

## 3. 系統需求與安裝步驟（Prerequisites & Installation）

### Python 桌面版

1. 安裝 Python 3.9+（建議使用 3.10+）
2. 建立虛擬環境（建議）
3. 安裝套件：`numpy`、`scipy`、`matplotlib`

```bash
cd C:\Users\user\Documents\Python\win_rate_calculator\win_rate_calculator
python -m venv .venv
.venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 網頁版

1. 只需要能開啟 `.html` 的瀏覽器（建議最新版本的 Chrome、Edge、Firefox）
2. 若需要避免本機檔案限制，建議用簡易伺服器開啟

```bash
cd C:\Users\user\Documents\Python\win_rate_calculator\win_rate_calculator
python -m http.server 8080
```

## 4. 快速上手與使用範例（Quick Start / Usage）

### A. 執行 Python 桌面版

1. 安裝完成後執行：

```bash
python win_rate_calculator.py
```

2. 在視窗中輸入參數：

1. `N`：預估對戰場次
2. `平手率`：0～100
3. `勝分`、`負分`、`平手分`
4. `牌組強度 / 牌組影響力`
5. `玩家強度 / 技術影響力`

3. 點擊計算後會顯示平均勝率、總分、±3σ 估計與分佈圖

### B. 執行網頁版

1. 啟動本機伺服器：

```bash
python -m http.server 8080
```

2. 用瀏覽器開啟 `http://127.0.0.1:8080/index.html`
3. 直接修改輸入欄位會即時計算結果，包含：

1. 平均勝率與機率明細
2. 平均總分與每場平均分
3. 勝率 CDF 與分數 CDF
4. 總分趨勢圖（含有無連勝加成差異）

### C. GitHub Pages 發佈（若需）

1. 將修改 push 到 `main` 或 `master`
2. 到 GitHub 專案設定 `Settings > Pages`
3. `Build and deployment` 選 `GitHub Actions`
4. 讓 `.github/workflows/deploy-pages.yml` 自動發佈

## 5. 專案架構說明（Project Structure）

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

### 核心檔案說明

1. `win_rate_calculator.py`：Python 桌面版主程式，包含 Tkinter 介面、參數驗證與分佈繪圖邏輯
2. `index.html`：網頁版頁面結構、結果顯示區、圖表畫布
3. `app.js`：網頁版核心計算、統計函式、輸入處理、圖表繪製、主題切換
4. `styles.css`：自訂 UI 樣式、明暗主題變數、RWD 版面
5. `requirements.txt`：Python 相依套件
6. `.github/workflows/deploy-pages.yml`：GitHub Pages 自動部署流程
7. `docs/screenshots/*`：專案畫面示意圖

## 6. 授權條款（License）

本專案採用 **MIT License**。你可自由使用、修改與再發佈，但需保留原始授權與版權聲明，不承擔因使用本程式造成的任何責任。

若要完整授權條文，請在專案根目錄新增 `LICENSE` 檔案並使用以下標準範本：

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

## 其他補充

本 `README.md` 已整理為專案現況所對應的版本。若你需要，我可以再幫你產生一版「純繁中、偏技術文件風格」與「偏產品展示、含截圖導覽」的 README 兩種差異版本做 A/B 選擇。
