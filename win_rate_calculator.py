import tkinter as tk
from tkinter import ttk, messagebox
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
import numpy as np
import math
from scipy.stats import norm
import matplotlib.ticker as mtick

# --- Core Calculation Logic ---
def calculate_win_rate():
    try:
        # --- Read Inputs ---
        num_games = int(num_games_var.get())
        draw_ratio = float(draw_ratio_var.get()) / 100.0
        win_score = float(win_score_var.get())
        loss_score = float(loss_score_var.get())
        draw_score = float(draw_score_var.get())
        deck_strength = float(deck_strength_var.get()) / 100.0
        deck_impact = float(deck_impact_var.get()) / 100.0
        skill_strength = float(skill_strength_var.get()) / 100.0
        skill_impact = float(skill_impact_var.get()) / 100.0

        # --- Input Validation ---
        if not (0 <= draw_ratio <= 1):
            messagebox.showerror("輸入錯誤", "和局佔比必須介於 0% 到 100% 之間。")
            return
        if not (0 <= deck_strength <= 1):
             messagebox.showerror("輸入錯誤", "牌組強度必須介於 0% 到 100% 之間。")
             return
        if not (0 <= deck_impact <= 1):
             messagebox.showerror("輸入錯誤", "牌組佔比必須介於 0% 到 100% 之間。")
             return
        if not (0 <= skill_strength <= 1):
            messagebox.showerror("輸入錯誤", "技術強度必須介於 0% 到 100% 之間。")
            return
        if not (0 <= skill_impact <= 1):
             messagebox.showerror("輸入錯誤", "技術佔比必須介於 0% 到 100% 之間。")
             return
        if deck_impact + skill_impact > (1 - draw_ratio):
             messagebox.showwarning("輸入警告", "牌組佔比和技術佔比的總和超過了非和局的可能性，結果可能不符直覺。")
             # Allow calculation to proceed but warn the user
             # Clamp impacts if needed for robustness, though the formula handles some aspects
             total_impact = deck_impact + skill_impact
             if total_impact > 0: # Avoid division by zero
                 scale_factor = min(1.0, (1 - draw_ratio) / total_impact * 0.999) # Scale down slightly below limit
                 deck_impact *= scale_factor
                 skill_impact *= scale_factor


        if num_games <= 0:
            messagebox.showerror("輸入錯誤", "遊戲場數必須是正整數。")
            return

        # --- Calculate Probabilities ---
        P_Draw = draw_ratio
        non_draw_prob = 1.0 - P_Draw

        # Calculate the deviation from 50% strength baseline
        # Strength 100% (1.0) => factor 0.5
        # Strength 50% (0.5) => factor 0.0
        # Strength 0% (0.0) => factor -0.5
        deck_advantage_factor = deck_strength - 0.5
        skill_advantage_factor = skill_strength - 0.5

        # Calculate the probability adjustment based on strength and impact
        # Multiply by 2 because the factor range (-0.5 to 0.5) maps to the full impact range
        deck_adjustment = deck_advantage_factor * 2 * deck_impact
        skill_adjustment = skill_advantage_factor * 2 * skill_impact

        # Base win probability within non-draw games, adjusted for deck and skill
        # Start from 0.5 and apply adjustments
        base_win_prob_before_draw = 0.5 + deck_adjustment + skill_adjustment
        # Clamp the base probability between 0 and 1
        base_win_prob_before_draw = max(0.0, min(1.0, base_win_prob_before_draw))

        # Final probabilities, scaled by the non-draw probability
        P_Win = base_win_prob_before_draw * non_draw_prob
        # Ensure P_Loss is not negative due to potential floating point inaccuracies near limits
        P_Loss = max(0.0, non_draw_prob - P_Win)

        # Recalculate P_Win based on clamped P_Loss if necessary
        #P_Win = non_draw_prob - P_Loss

        # --- Calculate Average Results ---
        avg_win_rate = P_Win
        avg_score_per_game = (P_Win * win_score) + (P_Loss * loss_score) + (P_Draw * draw_score)
        avg_total_score = avg_score_per_game * num_games

        # --- Calculate Standard Deviations ---
        # Standard deviation for the win *rate* (Win/Loss outcome treated as Bernoulli within non-draws, then scaled)
        # Variance of number of wins = n * p * (1-p) where p = P_Win, n = num_games
        # Std Dev of number of wins = sqrt(n * p * (1-p))
        # Std Dev of win rate = Std Dev of number / n = sqrt(p * (1-p) / n)
        # A slightly more direct way: variance of winning (1) or not winning (0) in a single game is P_Win * (1 - P_Win)
        variance_win_outcome = P_Win * (1 - P_Win)
        std_dev_win_rate = math.sqrt(variance_win_outcome / num_games) if num_games > 0 else 0

        # Standard deviation for the total score
        # Var(Score per game) = E[Score^2] - (E[Score])^2
        e_score_sq = (P_Win * (win_score**2)) + (P_Loss * (loss_score**2)) + (P_Draw * (draw_score**2))
        variance_score_per_game = e_score_sq - (avg_score_per_game**2)
        # Var(Total Score) = n * Var(Score per game)
        std_dev_score = math.sqrt(num_games * variance_score_per_game) if num_games > 0 and variance_score_per_game >= 0 else 0


        # --- Calculate +/- 3 Sigma Results ---
        lucky_win_rate = min(1.0, avg_win_rate + 3 * std_dev_win_rate)
        unlucky_win_rate = max(0.0, avg_win_rate - 3 * std_dev_win_rate)
        lucky_score = avg_total_score + 3 * std_dev_score
        unlucky_score = avg_total_score - 3 * std_dev_score

        # --- Update Result Labels ---
        avg_result_var.set(f"平均玩家勝率: {avg_win_rate:.2%}, 平均總分: {avg_total_score:,.2f}")
        lucky_result_var.set(f"+3σ 幸運玩家勝率: {lucky_win_rate:.2%}, 總分: {lucky_score:,.2f}")
        unlucky_result_var.set(f"-3σ 倒楣玩家勝率: {unlucky_win_rate:.2%}, 總分: {unlucky_score:,.2f}")
        
        # 設定中文字體
        try:
            plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'SimHei'] # SimHei 是簡體備用
            plt.rcParams['axes.unicode_minus'] = False  # 顯示負號
        except:
            print("\n警告：找不到指定的中文字體，圖表中的中文可能無法正常顯示。")

        
        results = {
            "P_Win": P_Win, "P_Loss": P_Loss, "P_Draw": P_Draw,
            "avg_win_rate": avg_win_rate, "avg_total_score": avg_total_score,
            "std_dev_win_rate": std_dev_win_rate, "std_dev_score": std_dev_score,
            "lucky_win_rate": lucky_win_rate, "unlucky_win_rate": unlucky_win_rate,
            "lucky_score": lucky_score, "unlucky_score": unlucky_score,
            "num_games": num_games,
            "win_score": win_score, "loss_score": loss_score, "draw_score": draw_score # Added for potential later use
        }
        return results

    except ValueError:
        messagebox.showerror("輸入錯誤", "請在所有欄位中輸入有效的數字。")
    except Exception as e:
        messagebox.showerror("計算錯誤", f"發生未預期的錯誤: {e}")

# --- 繪製勝率分佈圖的函數 ---
def plot_win_rate_distribution(stats):
    """
    繪製勝率的機率分佈曲線 (使用常態分佈近似)。
    X 軸是勝率，Y 軸是機率密度。
    """
    if stats is None: print("錯誤：無法繪製勝率圖，統計數據無效。"); return

    avg_win_rate = stats["avg_win_rate"]
    std_dev_win_rate = stats["std_dev_win_rate"]
    num_games = stats["num_games"]
    lucky_win_rate = stats["lucky_win_rate"]
    unlucky_win_rate = stats["unlucky_win_rate"]

    if std_dev_win_rate < 1e-9:
        print(f"\n勝率標準差過小 ({std_dev_win_rate:.2e})，勝率幾乎確定為 {avg_win_rate:.2%}。不繪製勝率密度曲線。")
        # Optionally plot a single vertical line
        # ... (code for vertical line plot omitted for brevity) ...
        return

    win_rate_norm_dist = norm(loc=avg_win_rate, scale=std_dev_win_rate)
    plot_wr_min = max(0.0, avg_win_rate - 4 * std_dev_win_rate)
    plot_wr_max = min(1.0, avg_win_rate + 4 * std_dev_win_rate)
    x_values = np.linspace(plot_wr_min, plot_wr_max, 500)
    cdf_values = win_rate_norm_dist.cdf(x_values)

    ax1.plot(cdf_values, x_values, 'r-', lw=2, label='勝率累積分布函數 (CDF)')
    ax1.axhline(avg_win_rate, color='black', linestyle='--', linewidth=1.5, label=f'平均勝率 ({avg_win_rate:.2%})')
    ax1.axhline(lucky_win_rate, color='blue', linestyle=':', linewidth=1.5, label=f'+3σ ({lucky_win_rate:.2%})')
    ax1.axhline(unlucky_win_rate, color='green', linestyle=':', linewidth=1.5, label=f'-3σ ({unlucky_win_rate:.2%})')

    ax1.set_xlabel('機率密度 (Probability Density)')
    ax1.set_ylabel('最終勝率 (%)')
    
    ax1.xaxis.set_major_formatter(mtick.PercentFormatter(xmax=1.0))
    ax1.yaxis.set_major_formatter(mtick.FormatStrFormatter('%.2f'))
    ax1.grid(True, linestyle=':', alpha=0.7)
    ax1.legend(loc='best')
    try:
        plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'SimHei']
        plt.rcParams['axes.unicode_minus'] = False
    except: print("\n警告：中文字體設定失敗(勝率圖)。")
    plt.tight_layout()
    # plt.show() # Display later after both plots are ready

# --- 繪製總得分分佈圖的函數 ---
def plot_score_distribution(stats):
    """
    繪製總得分的機率分佈曲線 (使用常態分佈近似)。
    X 軸是總得分，Y 軸是機率密度。
    """
    if stats is None: print("錯誤：無法繪製分數圖，統計數據無效。"); return

    avg_total_score = stats["avg_total_score"]
    std_dev_score = stats["std_dev_score"]
    num_games = stats["num_games"]
    lucky_score = stats["lucky_score"]
    unlucky_score = stats["unlucky_score"]

    # 檢查標準差是否為零或過小
    if std_dev_score < 1e-9:
        print(f"\n總得分標準差過小 ({std_dev_score:.2e})，總得分幾乎確定為 {avg_total_score:,.2f}。不繪製分數密度曲線。")
        # Optionally plot a single vertical line
        # ... (code for vertical line plot omitted for brevity) ...
        return

    # --- 繪製常態分佈近似曲線 ---
    score_norm_dist = norm(loc=avg_total_score, scale=std_dev_score)

    # 設定繪圖的 X 軸範圍 (總得分範圍)
    plot_score_min = avg_total_score - 4 * std_dev_score
    plot_score_max = avg_total_score + 4 * std_dev_score
    # 如果分數不可能為負，可以加限制 max(0, ...) 但這裡允許負分

    x_values = np.linspace(plot_score_min, plot_score_max, 500)
    cdf_values = score_norm_dist.cdf(x_values)

    # 開始繪圖
    # 繪製 PDF 曲線 (使用藍色)
    ax2.plot(cdf_values, x_values, 'b-', lw=2, label='總得分累積分布函數 (CDF)')
    # 標示平均值和 +/- 3 標準差的位置
    ax2.axhline(avg_total_score, color='black', linestyle='--', linewidth=1.5, label=f'平均分數 ({avg_total_score:,.1f})') # 調整小數位數
    ax2.axhline(lucky_score, color='purple', linestyle=':', linewidth=1.5, label=f'+3σ ({lucky_score:,.1f})')
    ax2.axhline(unlucky_score, color='orange', linestyle=':', linewidth=1.5, label=f'-3σ ({unlucky_score:,.1f})')

    # 設定圖表標籤和標題
    ax2.set_ylabel('最終總分數)')

    # 格式化座標軸
    # Y軸格式可以根據數值大小調整，如果密度值很小，科學記號可能更好
    ax2.yaxis.set_major_formatter(mtick.ScalarFormatter(useMathText=True)) # 讓 matplotlib 自動決定格式
    ax2.ticklabel_format(style='sci', axis='y', scilimits=(0,0)) # 強制 Y 軸使用科學記號

    # 添加網格線和圖例
    ax2.grid(True, linestyle=':', alpha=0.7)
    ax2.legend(loc='best')

    # 設定中文字體
    try:
        plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'SimHei']
        plt.rcParams['axes.unicode_minus'] = False
    except:
        print("\n警告：中文字體設定失敗(分數圖)。")

    plt.tight_layout()
    # plt.show() # Display later after both plots are ready

# --- GUI Setup ---
root = tk.Tk()
root.title("卡牌遊戲勝率與分數計算器")

# Style (optional, for better appearance)
style = ttk.Style()
style.theme_use('clam') # Or 'alt', 'default', 'classic'

main_frame = ttk.Frame(root, padding="10")
main_frame.pack(fill=tk.BOTH, expand=True)

# --- Input Section ---
input_frame = ttk.LabelFrame(main_frame, text="輸入參數", padding="10")
input_frame.pack(fill=tk.X, pady=5)
input_frame.columnconfigure(1, weight=1) # Allow entry fields to expand

# Input variables with default values
num_games_var = tk.StringVar(value="1000")
draw_ratio_var = tk.StringVar(value="2") # In percent
win_score_var = tk.StringVar(value="10")
loss_score_var = tk.StringVar(value="-10")
draw_score_var = tk.StringVar(value="0")
deck_strength_var = tk.StringVar(value="100") # In percent
deck_impact_var = tk.StringVar(value="4")   # In percent
skill_strength_var = tk.StringVar(value="100") # In percent
skill_impact_var = tk.StringVar(value="1")   # In percent

# Create Labels and Entries
ttk.Label(input_frame, text="遊戲場數 (N):").grid(row=0, column=0, padx=5, pady=2, sticky=tk.W)
ttk.Entry(input_frame, textvariable=num_games_var, width=10).grid(row=0, column=1, padx=5, pady=2, sticky=tk.EW)

ttk.Label(input_frame, text="和局佔比 (%):").grid(row=1, column=0, padx=5, pady=2, sticky=tk.W)
ttk.Entry(input_frame, textvariable=draw_ratio_var, width=10).grid(row=1, column=1, padx=5, pady=2, sticky=tk.EW)

ttk.Label(input_frame, text="勝利分數:").grid(row=2, column=0, padx=5, pady=2, sticky=tk.W)
ttk.Entry(input_frame, textvariable=win_score_var, width=10).grid(row=2, column=1, padx=5, pady=2, sticky=tk.EW)

ttk.Label(input_frame, text="失敗分數:").grid(row=3, column=0, padx=5, pady=2, sticky=tk.W)
ttk.Entry(input_frame, textvariable=loss_score_var, width=10).grid(row=3, column=1, padx=5, pady=2, sticky=tk.EW)

ttk.Label(input_frame, text="和局分數:").grid(row=4, column=0, padx=5, pady=2, sticky=tk.W)
ttk.Entry(input_frame, textvariable=draw_score_var, width=10).grid(row=4, column=1, padx=5, pady=2, sticky=tk.EW)

ttk.Label(input_frame, text="牌組強度 (%):").grid(row=0, column=2, padx=15, pady=2, sticky=tk.W)
ttk.Entry(input_frame, textvariable=deck_strength_var, width=10).grid(row=0, column=3, padx=5, pady=2, sticky=tk.EW)

ttk.Label(input_frame, text="牌組佔比 (%):").grid(row=1, column=2, padx=15, pady=2, sticky=tk.W)
ttk.Entry(input_frame, textvariable=deck_impact_var, width=10).grid(row=1, column=3, padx=5, pady=2, sticky=tk.EW)

ttk.Label(input_frame, text="技術強度 (%):").grid(row=2, column=2, padx=15, pady=2, sticky=tk.W)
ttk.Entry(input_frame, textvariable=skill_strength_var, width=10).grid(row=2, column=3, padx=5, pady=2, sticky=tk.EW)

ttk.Label(input_frame, text="技術佔比 (%):").grid(row=3, column=2, padx=15, pady=2, sticky=tk.W)
ttk.Entry(input_frame, textvariable=skill_impact_var, width=10).grid(row=3, column=3, padx=5, pady=2, sticky=tk.EW)


# --- Calculate Button ---
calculate_button = ttk.Button(main_frame, text="計算勝率與分數", command=calculate_win_rate)
calculate_button.pack(pady=10)

# --- Results Section ---
results_frame = ttk.LabelFrame(main_frame, text="計算結果", padding="10")
results_frame.pack(fill=tk.X, pady=5)

avg_result_var = tk.StringVar(value="平均玩家勝率: -, 平均總分: -")
lucky_result_var = tk.StringVar(value="+3σ 幸運玩家勝率: -, 總分: -")
unlucky_result_var = tk.StringVar(value="-3σ 倒楣玩家勝率: -, 總分: -")

ttk.Label(results_frame, textvariable=avg_result_var).pack(anchor=tk.W)
ttk.Label(results_frame, textvariable=lucky_result_var).pack(anchor=tk.W)
ttk.Label(results_frame, textvariable=unlucky_result_var).pack(anchor=tk.W)

# --- Plot Section ---
plot_frame = ttk.Frame(main_frame)
plot_frame.pack(fill=tk.BOTH, expand=True, pady=5)

fig, ax1 = plt.subplots(figsize=(8, 4)) # Create Figure and primary Axes
ax2 = ax1.twinx() # Create secondary Axes sharing x-axis - DO THIS INSIDE calculate_win_rate AFTER clearing

canvas = FigureCanvasTkAgg(fig, master=plot_frame)
canvas_widget = canvas.get_tk_widget()
canvas_widget.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

# Add the Matplotlib toolbar
toolbar = NavigationToolbar2Tk(canvas, plot_frame)
toolbar.update()
canvas_widget.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

game_stats = calculate_win_rate()

# --- 依序呼叫繪圖函數 ---
print("\n--- 繪製勝率機率分佈圖 ---")
plot_win_rate_distribution(game_stats)

print("\n--- 繪製總得分機率分佈圖 ---")
plot_score_distribution(game_stats)

# --- Run GUI ---
root.mainloop()