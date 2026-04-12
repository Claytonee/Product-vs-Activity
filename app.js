const API_URL = "https://heygen-premium-access-tool.vercel.app/api/chat";

const productWords = ['report', 'plan', 'dataset', 'summary', 'log', 'policy', 'guide', 'tool', 'record', 'certificate', 'evaluation', 'assessment', 'tracker', 'map', 'dashboard', 'register', 'audit', 'manual', 'checklist', 'protocol', 'indicator', 'brief', 'analysis', 'memo', 'schedule'];
const activityWords = ['conduct', 'train', 'support', 'hold', 'visit', 'organize', 'attend', 'discuss', 'implement', 'monitor', 'prepare', 'meet', 'help', 'follow up', 'observe', 'present'];

function runLocalTest() {
  const val = document.getElementById('testInput').value.trim().toLowerCase();
  const fb = document.getElementById('testFeedback');

  if (!val) {
    fb.textContent = 'Please type something to test.';
    fb.style.color = '#e74c3c';
    return;
  }

  const matchesProduct = productWords.filter(w => val.includes(w));
  const matchesActivity = activityWords.filter(w => val.includes(w));
  const isProduct = matchesProduct.length > 0;
  const isActivity = matchesActivity.length > 0;

  if (isProduct && !isActivity) {
    fb.textContent = `✅ Likely a PRODUCT. It includes ${matchesProduct.join(', ')}.`;
    fb.style.color = '#27ae60';
  } else if (isProduct && isActivity) {
    fb.textContent = `⚠️ Mixed wording. Contains product terms (${matchesProduct.join(', ')}) and activity terms (${matchesActivity.join(', ')}). Make it a clear product title.`;
    fb.style.color = '#f39c12';
  } else if (isActivity) {
    if (val.match(/\d/)) {
      fb.textContent = `⚠️ Quantified activity. "${val}" has numbers but describes an action. Convert to a product like "${val} Report" or "${val} Summary".`;
      fb.style.color = '#f39c12';
    } else {
      fb.textContent = '❌ Sounds like an ACTIVITY. Convert it to a noun/output first.';
      fb.style.color = '#CC143C';
    }
  } else {
    fb.textContent = '⚠️ Unclear. Add a product noun (Report/Dataset/Plan/Summary) and specify what is captured.';
    fb.style.color = '#f39c12';
  }
}

async function runAICheck() {
  const input = document.getElementById('testInput').value.trim();
  const fb = document.getElementById('aiFeedback');

  if (!input) {
    fb.textContent = 'Please type something to test.';
    fb.style.color = '#e74c3c';
    return;
  }

  if (!API_URL) {
    fb.textContent = '⚠️ Backend API URL is not configured.';
    fb.style.color = '#f39c12';
    return;
  }

  fb.textContent = '⌛ Checking with AI...';
  fb.style.color = '#2c3e50';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: 'classify',
        message: input
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Unable to classify message.');
    }

    fb.textContent = `✅ ${result.reply}`;
    if (result.reply.toLowerCase().includes('activity')) {
      fb.style.color = '#CC143C';
    } else {
      fb.style.color = '#27ae60';
    }
  } catch (error) {
    fb.textContent = `⚠️ AI check failed: ${error.message}`;
    fb.style.color = '#e74c3c';
  }
}

async function convertActivityToProduct() {
  const input = document.getElementById('activityInput').value.trim();
  const fb = document.getElementById('convertFeedback');

  if (!input) {
    fb.textContent = 'Please type an activity to convert.';
    fb.style.color = '#e74c3c';
    return;
  }

  if (!API_URL) {
    fb.textContent = '⚠️ Backend API URL is not configured.';
    fb.style.color = '#f39c12';
    return;
  }

  fb.textContent = '⌛ Converting with AI...';
  fb.style.color = '#2c3e50';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: 'convert',
        message: input
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Unable to convert message.');
    }

    fb.textContent = `✅ Converted Product: ${result.reply}`;
    fb.style.color = '#27ae60';
  } catch (error) {
    fb.textContent = `⚠️ Conversion failed: ${error.message}`;
    fb.style.color = '#e74c3c';
  }
}

function copyFormat() {
  navigator.clipboard.writeText('[Product Name] + (what was done + what is captured/documented)');
  alert('✅ Copied to clipboard!');
}

function copyStandard() {
  navigator.clipboard.writeText('[Name of Product] (key detail of what is captured/measured)');
  alert('✅ Standard format copied!');
}

function checkQuiz() {
  const answers = {
    q1: document.querySelector('input[name="q1"]:checked')?.value,
    q2: document.querySelector('input[name="q2"]:checked')?.value,
    q3: document.querySelector('input[name="q3"]:checked')?.value,
    q4: document.querySelector('input[name="q4"]:checked')?.value,
    q5: document.querySelector('input[name="q5"]:checked')?.value,
    q6: document.querySelector('input[name="q6"]:checked')?.value,
    q7: document.querySelector('input[name="q7"]:checked')?.value,
    q8: document.querySelector('input[name="q8"]:checked')?.value,
    q9: document.querySelector('input[name="q9"]:checked')?.value,
    q10: document.querySelector('input[name="q10"]:checked')?.value,
  };

  const result = document.getElementById('quizResult');
  if (Object.values(answers).some(value => !value)) {
    result.textContent = 'Please answer all questions.';
    result.style.color = '#e74c3c';
    return;
  }

  const correct = {
    q1: 'b', q2: 'c', q3: 'b', q4: 'b', q5: 'b', q6: 'a', q7: 'a', q8: 'b', q9: 'b', q10: 'a'
  };

  let score = 0;
  for (const key in correct) {
    if (answers[key] === correct[key]) score++;
  }

  result.textContent = `📊 Score: ${score}/10. ${score === 10 ? '🎉 Excellent! You understand the difference well.' : 'Review the product examples and conversion formula again.'}`;
  result.style.color = score === 10 ? '#27ae60' : '#f39c12';
}

window.runLocalTest = runLocalTest;
window.runAICheck = runAICheck;
window.convertActivityToProduct = convertActivityToProduct;
window.copyFormat = copyFormat;
window.copyStandard = copyStandard;
window.checkQuiz = checkQuiz;
