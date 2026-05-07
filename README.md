# 1v1 勝率與分數模擬器

這個專案已改寫成可直接部署到 GitHub Pages 的靜態網頁版。原本的 `win_rate_calculator.py` 仍保留作為 Python/Tkinter 版本參考。

## 功能

- 輸入總局數、平手率、勝利/失敗/平手分數。
- 設定牌組強度、牌組影響、技術強度、技術影響。
- 即時計算平均勝率、平均總分、單局期望、勝/敗/平機率。
- 顯示勝率與總分的 +/-3σ 區間。
- 使用 Canvas 繪製勝率與總分的常態累積分布圖。

## 本機使用

直接用瀏覽器開啟 `index.html` 即可，不需要安裝套件。

## GitHub Pages 部署

專案已包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 或 `master` 後，GitHub Actions 會自動部署。

第一次使用時請在 GitHub repository：

1. 開啟 `Settings`。
2. 進入 `Pages`。
3. 在 `Build and deployment` 的 `Source` 選擇 `GitHub Actions`。
4. 推送程式碼後，到 `Actions` 查看 `Deploy GitHub Pages` workflow。

## Python 版本

若仍要執行舊版桌面程式：

```bash
pip install -r requirements.txt
python win_rate_calculator.py
```
