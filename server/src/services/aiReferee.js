const AppError = require('../utils/AppError');

// We use native fetch (Node 18+) or you could use axios
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;

const fetchWithTimeout = async (url, options, timeout = TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
};

const callOpenAI = async (prompt) => {
  const response = await fetchWithTimeout(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error(`OpenAI Error: ${response.statusText}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};

const callGemini = async (prompt) => {
  const url = `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt + "\n\nIMPORTANT: Return ONLY the JSON object, no markdown blocks." }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        response_mime_type: "application/json",
      }
    })
  });

  if (!response.ok) throw new Error(`Gemini Error: ${response.statusText}`);
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
};

exports.evaluateSubmissions = async ({ subA, subB, userAId, userBId }) => {
  const prompt = `Compare two codes and return JSON:\nCode A:\n${subA}\nCode B:\n${subB}\nReturn:\n{ winnerUserId, scoreA, scoreB, reason, improvementsA, improvementsB }`;

  let result = null;

  try {
    result = await callOpenAI(prompt);
  } catch (err) {
    console.error(`OpenAI failed: ${err.message}. Trying Gemini...`);
    try {
      result = await callGemini(prompt);
    } catch (err2) {
      console.error(`Gemini failed: ${err2.message}`);
    }
  }

  // Fallback if parsing fails or all LLMs fail
  if (!result || typeof result !== 'object') {
    return {
      winnerUserId: null,
      scoreA: 0,
      scoreB: 0,
      reason: "AI parsing failed. Declared tie.",
      improvementsA: [],
      improvementsB: []
    };
  }

  // If winnerUserId is missing but scores exist, infer the winner
  if (!result.winnerUserId) {
    if (result.scoreA > result.scoreB) result.winnerUserId = userAId;
    else if (result.scoreB > result.scoreA) result.winnerUserId = userBId;
    else result.winnerUserId = null;
  } else if (result.winnerUserId === 'tie') {
    result.winnerUserId = null;
  }

  return result;
};
