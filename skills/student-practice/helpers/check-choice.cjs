const [countText, keyText, answerText, ...extra] = process.argv.slice(2);

function numberInRange(value, maximum) {
  return /^[1-9][0-9]*$/.test(value ?? "") && Number(value) <= maximum;
}

if (extra.length || !numberInRange(countText, 5) || Number(countText) < 2) {
  console.error("Usage: check-choice.cjs <option-count 2–5> <correct-option> <selected-option|skip>");
  process.exitCode = 2;
} else {
  const count = Number(countText);
  if (!numberInRange(keyText, count) || (answerText !== "skip" && !numberInRange(answerText, count))) {
    console.error("Option numbers must be between 1 and the number of options.");
    process.exitCode = 2;
  } else {
    const status = answerText === "skip" ? "unknown" : answerText === keyText ? "correct" : "incorrect";
    console.log(JSON.stringify({
      status,
      selectedOption: answerText === "skip" ? null : Number(answerText),
      correctOption: Number(keyText),
    }));
  }
}
