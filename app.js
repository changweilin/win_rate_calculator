const defaults = {
  numGames: 1000,
  drawRatio: 2,
  winScore: 10,
  lossScore: -10,
  drawScore: 0,
  streakBonusPerWin: 3,
  streakBonusCap: 15,
  deckStrength: 100,
  deckImpact: 4,
  skillStrength: 100,
  skillImpact: 1,
};

const form = document.querySelector("#calculatorForm");
const warning = document.querySelector("#warning");
const themeToggle = document.querySelector("#themeToggle");
const themeToggleText = document.querySelector("#themeToggleText");
const els = {
  heroWinRate: document.querySelector("#heroWinRate"),
  heroScore: document.querySelector("#heroScore"),
  heroPerGame: document.querySelector("#heroPerGame"),
  probabilityBadge: document.querySelector("#probabilityBadge"),
  avgWinRate: document.querySelector("#avgWinRate"),
  avgScore: document.querySelector("#avgScore"),
  luckyWinRate: document.querySelector("#luckyWinRate"),
  luckyScore: document.querySelector("#luckyScore"),
  unluckyWinRate: document.querySelector("#unluckyWinRate"),
  unluckyScore: document.querySelector("#unluckyScore"),
  probabilities: document.querySelector("#probabilities"),
  winStd: document.querySelector("#winStd"),
  scoreStd: document.querySelector("#scoreStd"),
  winRateChart: document.querySelector("#winRateChart"),
  scoreChart: document.querySelector("#scoreChart"),
  trendChart: document.querySelector("#trendChart"),
};

const percentFormat = new Intl.NumberFormat("zh-TW", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numberFormat = new Intl.NumberFormat("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readNumber(name) {
  const input = form.elements[name];
  const value = Number(input.value);
  if (!Number.isFinite(value)) {
    throw new Error(`${input.closest("label").querySelector("span").textContent} 必須是數字`);
  }
  return value;
}

function calculate(values) {
  const numGames = Math.trunc(values.numGames);
  const drawRatio = values.drawRatio / 100;
  const winScore = values.winScore;
  const lossScore = values.lossScore;
  const drawScore = values.drawScore;
  const streakBonusPerWin = values.streakBonusPerWin;
  const streakBonusCap = values.streakBonusCap;
  const deckStrength = values.deckStrength / 100;
  let deckImpact = values.deckImpact / 100;
  const skillStrength = values.skillStrength / 100;
  let skillImpact = values.skillImpact / 100;

  if (numGames <= 0) throw new Error("總局數必須大於 0");
  if (streakBonusPerWin < 0 || streakBonusCap < 0) throw new Error("連勝加分與上限不可小於 0");
  for (const [label, value] of [["平手率", drawRatio], ["牌組強度", deckStrength], ["牌組影響", deckImpact], ["技術強度", skillStrength], ["技術影響", skillImpact]]) {
    if (value < 0 || value > 1) throw new Error(`${label} 必須介於 0% 到 100%`);
  }

  let note = "";
  if (deckImpact + skillImpact > 1 - drawRatio) {
    const totalImpact = deckImpact + skillImpact;
    const scaleFactor = totalImpact > 0 ? ((1 - drawRatio) / totalImpact) * 0.999 : 1;
    deckImpact *= Math.min(1, scaleFactor);
    skillImpact *= Math.min(1, scaleFactor);
    note = "牌組影響與技術影響加總超過非平手機率，已依原 Python 版邏輯等比例縮小後計算。";
  }

  const pDraw = drawRatio;
  const nonDrawProb = 1 - pDraw;
  const deckAdjustment = (deckStrength - 0.5) * 2 * deckImpact;
  const skillAdjustment = (skillStrength - 0.5) * 2 * skillImpact;
  const baseWinProbBeforeDraw = clamp(0.5 + deckAdjustment + skillAdjustment, 0, 1);
  const pWin = baseWinProbBeforeDraw * nonDrawProb;
  const pLoss = Math.max(0, nonDrawProb - pWin);
  const avgWinRate = pWin;
  const stdDevWinRate = Math.sqrt((pWin * (1 - pWin)) / numGames);
  const scoreStats = calculateStreakScoreStats({
    numGames,
    pWin,
    pLoss,
    pDraw,
    winScore,
    lossScore,
    drawScore,
    streakBonusPerWin,
    streakBonusCap,
  });
  const avgScorePerGame = scoreStats.avgScorePerGame;
  const avgTotalScore = scoreStats.avgTotalScore;
  const stdDevScore = scoreStats.stdDevScore;

  return {
    note,
    numGames,
    pWin,
    pLoss,
    pDraw,
    avgWinRate,
    avgScorePerGame,
    avgTotalScore,
    stdDevWinRate,
    stdDevScore,
    trend: scoreStats.trend,
    luckyWinRate: clamp(avgWinRate + 3 * stdDevWinRate, 0, 1),
    unluckyWinRate: clamp(avgWinRate - 3 * stdDevWinRate, 0, 1),
    luckyScore: avgTotalScore + 3 * stdDevScore,
    unluckyScore: avgTotalScore - 3 * stdDevScore,
  };
}

function erf(x) {
  const sign = Math.sign(x) || 1;
  const absX = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absX);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-absX * absX);
  return sign * y;
}

function normalCdf(x, mean, stdDev) {
  if (stdDev < 1e-12) return x < mean ? 0 : 1;
  return 0.5 * (1 + erf((x - mean) / (stdDev * Math.SQRT2)));
}

function calculateStreakScoreStats({
  numGames,
  pWin,
  pLoss,
  pDraw,
  winScore,
  lossScore,
  drawScore,
  streakBonusPerWin,
  streakBonusCap,
}) {
  const baseAvgScorePerGame = pWin * winScore + pLoss * lossScore + pDraw * drawScore;
  if (streakBonusPerWin <= 0 || streakBonusCap <= 0) {
    const eScoreSq = pWin * winScore ** 2 + pLoss * lossScore ** 2 + pDraw * drawScore ** 2;
    const varianceScorePerGame = Math.max(0, eScoreSq - baseAvgScorePerGame ** 2);
    return {
      avgScorePerGame: baseAvgScorePerGame,
      avgTotalScore: baseAvgScorePerGame * numGames,
      stdDevScore: Math.sqrt(numGames * varianceScorePerGame),
      trend: Array.from({ length: numGames }, (_, index) => ({
        game: index + 1,
        baseScore: baseAvgScorePerGame * (index + 1),
        streakScore: baseAvgScorePerGame * (index + 1),
      })),
    };
  }

  const maxStreak = Math.max(1, Math.min(numGames, Math.ceil(streakBonusCap / streakBonusPerWin)));
  let stateProb = Array(maxStreak + 1).fill(0);
  let stateMean = Array(maxStreak + 1).fill(0);
  let stateSecondMoment = Array(maxStreak + 1).fill(0);
  stateProb[0] = 1;
  const trend = [];

  const addTransition = (nextProb, nextMean, nextSecondMoment, from, chance, nextState, score) => {
    if (chance <= 0 || stateProb[from] <= 0) return;
    const weightedProb = stateProb[from] * chance;
    nextProb[nextState] += weightedProb;
    nextMean[nextState] += chance * (stateMean[from] + score * stateProb[from]);
    nextSecondMoment[nextState] += chance * (
      stateSecondMoment[from] +
      2 * score * stateMean[from] +
      score ** 2 * stateProb[from]
    );
  };

  for (let game = 0; game < numGames; game++) {
    const nextProb = Array(maxStreak + 1).fill(0);
    const nextMean = Array(maxStreak + 1).fill(0);
    const nextSecondMoment = Array(maxStreak + 1).fill(0);

    for (let streak = 0; streak <= maxStreak; streak++) {
      const nextWinStreak = Math.min(streak + 1, maxStreak);
      const winBonus = Math.min(nextWinStreak * streakBonusPerWin, streakBonusCap);
      addTransition(nextProb, nextMean, nextSecondMoment, streak, pWin, nextWinStreak, winScore + winBonus);
      addTransition(nextProb, nextMean, nextSecondMoment, streak, pLoss, 0, lossScore);
      addTransition(nextProb, nextMean, nextSecondMoment, streak, pDraw, streak, drawScore);
    }

    stateProb = nextProb;
    stateMean = nextMean;
    stateSecondMoment = nextSecondMoment;

    trend.push({
      game: game + 1,
      baseScore: baseAvgScorePerGame * (game + 1),
      streakScore: stateMean.reduce((sum, value) => sum + value, 0),
    });
  }

  const avgTotalScore = stateMean.reduce((sum, value) => sum + value, 0);
  const secondMoment = stateSecondMoment.reduce((sum, value) => sum + value, 0);
  const varianceScore = Math.max(0, secondMoment - avgTotalScore ** 2);

  return {
    avgScorePerGame: avgTotalScore / numGames,
    avgTotalScore,
    stdDevScore: Math.sqrt(varianceScore),
    trend,
  };
}

function drawReference(ctx, pad, plotWidth, yForValue, value, color, label, formatY) {
  const y = yForValue(value);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(pad.left, y);
  ctx.lineTo(pad.left + plotWidth, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = "600 13px Microsoft JhengHei, sans-serif";
  ctx.fillText(`${label} ${formatY(value)}`, pad.left + 10, clamp(y - 8, pad.top + 12, pad.top + 310));
}

function drawChart(canvas, config) {
  const ctx = canvas.getContext("2d");
  const theme = getComputedStyle(document.documentElement);
  const width = canvas.width;
  const height = canvas.height;
  const pad = { left: 78, right: 26, top: 28, bottom: 58 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const valueSpan = config.max - config.min || 1;
  const yForValue = (value) => pad.top + (1 - (value - config.min) / valueSpan) * plotHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = theme.getPropertyValue("--chart-bg").trim();
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = theme.getPropertyValue("--chart-grid").trim();
  ctx.lineWidth = 1;
  ctx.font = "14px Microsoft JhengHei, sans-serif";
  ctx.fillStyle = theme.getPropertyValue("--chart-text").trim();

  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (plotWidth * i) / 5;
    const y = pad.top + (plotHeight * i) / 5;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotHeight);
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotWidth, y);
    ctx.stroke();
    ctx.fillText(`${i * 20}%`, x - 12, pad.top + plotHeight + 28);
    ctx.fillText(config.formatY(config.max - (valueSpan * i) / 5), 8, y + 5);
  }

  ctx.strokeStyle = config.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 420; i++) {
    const yValue = config.min + (valueSpan * i) / 420;
    const x = pad.left + normalCdf(yValue, config.mean, config.stdDev) * plotWidth;
    const y = yForValue(yValue);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  drawReference(ctx, pad, plotWidth, yForValue, config.mean, theme.getPropertyValue("--chart-mean").trim(), "平均", config.formatY);
  drawReference(ctx, pad, plotWidth, yForValue, config.high, theme.getPropertyValue("--chart-high").trim(), "+3σ", config.formatY);
  drawReference(ctx, pad, plotWidth, yForValue, config.low, theme.getPropertyValue("--chart-low").trim(), "-3σ", config.formatY);
  ctx.fillStyle = theme.getPropertyValue("--chart-mean").trim();
  ctx.font = "600 15px Microsoft JhengHei, sans-serif";
  ctx.fillText("累積機率", pad.left + plotWidth / 2 - 28, height - 14);
}

function drawTrendChart(canvas, trend) {
  if (!canvas || !trend?.length) return;
  const ctx = canvas.getContext("2d");
  const theme = getComputedStyle(document.documentElement);
  const width = canvas.width;
  const height = canvas.height;
  const pad = { left: 78, right: 26, top: 28, bottom: 58 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const maxGame = trend[trend.length - 1].game;
  const scores = trend.flatMap((point) => [point.baseScore, point.streakScore]);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreSpan = maxScore - minScore || 1;
  const xForGame = (game) => pad.left + ((game - 1) / Math.max(1, maxGame - 1)) * plotWidth;
  const yForScore = (score) => pad.top + (1 - (score - minScore) / scoreSpan) * plotHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = theme.getPropertyValue("--chart-bg").trim();
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = theme.getPropertyValue("--chart-grid").trim();
  ctx.lineWidth = 1;
  ctx.font = "14px Microsoft JhengHei, sans-serif";
  ctx.fillStyle = theme.getPropertyValue("--chart-text").trim();

  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (plotWidth * i) / 5;
    const y = pad.top + (plotHeight * i) / 5;
    const gameLabel = Math.round(1 + ((maxGame - 1) * i) / 5);
    const scoreLabel = maxScore - (scoreSpan * i) / 5;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotHeight);
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotWidth, y);
    ctx.stroke();
    ctx.fillText(String(gameLabel), x - 12, pad.top + plotHeight + 28);
    ctx.fillText(numberFormat.format(scoreLabel), 8, y + 5);
  }

  const drawLine = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    trend.forEach((point, index) => {
      const x = xForGame(point.game);
      const y = yForScore(point[key]);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  drawLine("baseScore", theme.getPropertyValue("--chart-low").trim());
  drawLine("streakScore", theme.getPropertyValue("--chart-high").trim());

  ctx.fillStyle = theme.getPropertyValue("--chart-low").trim();
  ctx.fillText("無連勝", pad.left + 8, pad.top + 18);
  ctx.fillStyle = theme.getPropertyValue("--chart-high").trim();
  ctx.fillText("含連勝", pad.left + 86, pad.top + 18);
  ctx.fillStyle = theme.getPropertyValue("--chart-mean").trim();
  ctx.font = "600 15px Microsoft JhengHei, sans-serif";
  ctx.fillText("局數", pad.left + plotWidth / 2 - 14, height - 14);
}

function render(stats) {
  warning.hidden = !stats.note;
  warning.textContent = stats.note;
  els.heroWinRate.textContent = percentFormat.format(stats.avgWinRate);
  els.heroScore.textContent = numberFormat.format(stats.avgTotalScore);
  els.heroPerGame.textContent = numberFormat.format(stats.avgScorePerGame);
  els.probabilityBadge.textContent = `${percentFormat.format(stats.pWin)} / ${percentFormat.format(stats.pLoss)} / ${percentFormat.format(stats.pDraw)}`;
  els.avgWinRate.textContent = percentFormat.format(stats.avgWinRate);
  els.avgScore.textContent = `總分 ${numberFormat.format(stats.avgTotalScore)}`;
  els.luckyWinRate.textContent = percentFormat.format(stats.luckyWinRate);
  els.luckyScore.textContent = `總分 ${numberFormat.format(stats.luckyScore)}`;
  els.unluckyWinRate.textContent = percentFormat.format(stats.unluckyWinRate);
  els.unluckyScore.textContent = `總分 ${numberFormat.format(stats.unluckyScore)}`;
  els.probabilities.textContent = `${percentFormat.format(stats.pWin)} / ${percentFormat.format(stats.pLoss)} / ${percentFormat.format(stats.pDraw)}`;
  els.winStd.textContent = percentFormat.format(stats.stdDevWinRate);
  els.scoreStd.textContent = numberFormat.format(stats.stdDevScore);

  drawChart(els.winRateChart, {
    min: clamp(stats.avgWinRate - 4 * stats.stdDevWinRate, 0, 1),
    max: clamp(stats.avgWinRate + 4 * stats.stdDevWinRate, 0, 1),
    mean: stats.avgWinRate,
    stdDev: stats.stdDevWinRate,
    low: stats.unluckyWinRate,
    high: stats.luckyWinRate,
    color: "#c0395a",
    formatY: (value) => percentFormat.format(value),
  });
  drawChart(els.scoreChart, {
    min: stats.avgTotalScore - 4 * stats.stdDevScore,
    max: stats.avgTotalScore + 4 * stats.stdDevScore,
    mean: stats.avgTotalScore,
    stdDev: stats.stdDevScore,
    low: stats.unluckyScore,
    high: stats.luckyScore,
    color: "#117a65",
    formatY: (value) => numberFormat.format(value),
  });
  drawTrendChart(els.trendChart, stats.trend);
}

function update() {
  try {
    const values = Object.fromEntries(Object.keys(defaults).map((name) => [name, readNumber(name)]));
    render(calculate(values));
  } catch (error) {
    warning.hidden = false;
    warning.textContent = error.message;
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggleText.textContent = isDark ? "晚上模式" : "白天模式";
  localStorage.setItem("winRateTheme", theme);
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem("winRateTheme");
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

form.addEventListener("input", update);
form.addEventListener("reset", () => {
  requestAnimationFrame(() => {
    for (const [name, value] of Object.entries(defaults)) form.elements[name].value = value;
    update();
  });
});
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  update();
});
applyTheme(getInitialTheme());
update();
