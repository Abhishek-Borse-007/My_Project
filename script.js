function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function calculateEMI(principal, annualRate, years) {
  const months = years * 12;
  const monthlyRate = annualRate / 12 / 100;

  if (!principal || !annualRate || !years) {
    return { emi: 0, totalInterest: 0, totalRepayment: 0, months: 0 };
  }

  const factor = Math.pow(1 + monthlyRate, months);
  const emi = principal * monthlyRate * factor / (factor - 1);
  const totalRepayment = emi * months;
  const totalInterest = totalRepayment - principal;

  return { emi, totalInterest, totalRepayment, months };
}

function drawChart(canvas, principal, totalInterest) {
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const total = principal + totalInterest;
  const principalWidth = total ? (principal / total) * (width - 80) : 0;
  const interestWidth = total ? (totalInterest / total) * (width - 80) : 0;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#10233a";
  ctx.font = "700 16px Source Sans 3";
  ctx.fillText("Loan Components", 24, 32);

  ctx.fillStyle = "#53657a";
  ctx.font = "400 13px Source Sans 3";
  ctx.fillText("Compare principal and total interest over the loan term", 24, 52);

  const baseX = 24;
  const principalY = 92;
  const interestY = 156;
  const barHeight = 26;

  ctx.fillStyle = "rgba(16, 35, 58, 0.08)";
  ctx.fillRect(baseX, principalY, width - 80, barHeight);
  ctx.fillRect(baseX, interestY, width - 80, barHeight);

  ctx.fillStyle = "#1b998b";
  ctx.fillRect(baseX, principalY, principalWidth, barHeight);

  ctx.fillStyle = "#ef8354";
  ctx.fillRect(baseX, interestY, interestWidth, barHeight);

  ctx.fillStyle = "#10233a";
  ctx.font = "700 14px Source Sans 3";
  ctx.fillText("Principal", baseX, principalY - 10);
  ctx.fillText("Interest", baseX, interestY - 10);

  ctx.textAlign = "right";
  ctx.fillText(formatINR(principal), width - 24, principalY + 19);
  ctx.fillText(formatINR(totalInterest), width - 24, interestY + 19);
  ctx.textAlign = "start";
}

function setInputPair(input, range, formatter, suffix) {
  if (!input || !range) {
    return;
  }

  const sync = (value) => {
    input.value = value;
    range.value = value;
    const label = document.getElementById(range.id + "-value");
    if (label) {
      label.textContent = formatter ? formatter(Number(value)) : `${value}${suffix || ""}`;
    }
  };

  input.addEventListener("input", () => sync(input.value));
  range.addEventListener("input", () => sync(range.value));
  sync(input.value);
}

function loadCalculator() {
  const form = document.getElementById("emi-form");
  if (!form) {
    return;
  }

  const loanAmountInput = document.getElementById("loan-amount");
  const rateInput = document.getElementById("interest-rate");
  const tenureInput = document.getElementById("loan-tenure");
  const loanAmountRange = document.getElementById("loan-amount-range");
  const rateRange = document.getElementById("interest-rate-range");
  const tenureRange = document.getElementById("loan-tenure-range");
  const emiValue = document.getElementById("emi-value");
  const interestValue = document.getElementById("interest-value");
  const repaymentValue = document.getElementById("repayment-value");
  const monthsValue = document.getElementById("months-value");
  const summaryText = document.getElementById("summary-text");
  const chart = document.getElementById("emi-chart");

  setInputPair(loanAmountInput, loanAmountRange, formatINR);
  setInputPair(rateInput, rateRange, (value) => `${Number(value).toFixed(2)}%`);
  setInputPair(tenureInput, tenureRange, (value) => `${value} years`);

  const params = new URLSearchParams(window.location.search);
  if (params.has("loan")) loanAmountInput.value = params.get("loan");
  if (params.has("rate")) rateInput.value = params.get("rate");
  if (params.has("tenure")) tenureInput.value = params.get("tenure");

  loanAmountRange.value = loanAmountInput.value;
  rateRange.value = rateInput.value;
  tenureRange.value = tenureInput.value;

  function updateResults() {
    const principal = Number(loanAmountInput.value);
    const annualRate = Number(rateInput.value);
    const years = Number(tenureInput.value);
    const result = calculateEMI(principal, annualRate, years);

    emiValue.textContent = formatINR(result.emi);
    interestValue.textContent = formatINR(result.totalInterest);
    repaymentValue.textContent = formatINR(result.totalRepayment);
    monthsValue.textContent = formatNumber(result.months);

    summaryText.textContent = `For a loan amount of ${formatINR(principal)} at ${annualRate.toFixed(2)}% annual interest for ${years} years, your estimated monthly EMI is ${formatINR(result.emi)}. You would repay ${formatINR(result.totalRepayment)} in total, including ${formatINR(result.totalInterest)} as interest.`;

    document.getElementById("loan-amount-range-value").textContent = formatINR(principal);
    document.getElementById("interest-rate-range-value").textContent = `${annualRate.toFixed(2)}%`;
    document.getElementById("loan-tenure-range-value").textContent = `${years} years`;

    drawChart(chart, principal, result.totalInterest);
  }

  [loanAmountInput, rateInput, tenureInput, loanAmountRange, rateRange, tenureRange].forEach((element) => {
    element.addEventListener("input", updateResults);
  });

  document.querySelectorAll(".preset-button").forEach((button) => {
    button.addEventListener("click", () => {
      loanAmountInput.value = button.dataset.loan;
      rateInput.value = button.dataset.rate;
      tenureInput.value = button.dataset.tenure;
      loanAmountRange.value = button.dataset.loan;
      rateRange.value = button.dataset.rate;
      tenureRange.value = button.dataset.tenure;
      updateResults();
    });
  });

  updateResults();
}

function loadNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadNavigation();
  loadCalculator();
});
