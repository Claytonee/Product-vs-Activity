const allowedOrigins = ['*'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.join(','));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mode } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Missing or invalid 'message' field." });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration missing API key.' });
    }

    let prompt = message;

    if (mode === 'classify') {
      prompt = `You are an M&E specialist. Classify the following phrase strictly as PRODUCT or ACTIVITY. Answer with a single label and a short explanation.\n\nPhrase: "${message}"`;
    } else if (mode === 'convert') {
      prompt = `You are an M&E specialist. Convert this ACTIVITY into a PRODUCT phrase.

CRITICAL: A PRODUCT must be a NOUN-based deliverable (Report, Dataset, Plan, Summary, Log, etc.)
NEVER return a verb-based activity (Visit, Conduct, Train, Hold, etc.)

Format: [Product Name] (what is documented/measured)

Examples with numbers:
- "3 schools visited" → "School Visit Report (3 schools visited, observations documented)"
- "12 teachers trained" → "Teacher Training Report (12 teachers trained, competencies assessed)"
- "5 meetings held" → "Meeting Summary Report (5 meetings held, decisions documented)"

More examples:
- "Conduct teacher training" → "Teacher Training Completion Report (attendance, feedback & outcomes documented)"
- "Visit schools for support" → "School Support Visit Report (schools visited, observations & action points documented)"
- "Collect data from schools" → "Compiled School Data Dataset (metrics collected, cleaned & validated)"

Return ONLY the product phrase. No explanations.

Activity: "${message}"`;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    const raw = await response.text();
    let json;
    try {
      json = JSON.parse(raw);
    } catch (parseError) {
      return res.status(502).json({ error: 'Invalid JSON from Groq API', details: raw.slice(0, 200) });
    }

    if (!response.ok) {
      const errorMessage = json.error?.message || response.statusText || 'Unknown API error';
      return res.status(502).json({ error: `Groq API error: ${errorMessage}`, details: json });
    }

    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'Invalid response format from AI provider.', details: json });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('API handler error:', error?.stack || error);
    return res.status(500).json({
      error: error?.message || String(error) || 'Internal server error',
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined
    });
  }
}
