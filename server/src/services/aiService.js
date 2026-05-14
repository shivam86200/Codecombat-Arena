const AppError = require('../utils/AppError');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const TIMEOUT_MS = 25000;

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
      temperature: 0.7,
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
      contents: [{ parts: [{ text: prompt + "\n\nIMPORTANT: Return ONLY a valid JSON object with a 'problems' array. No markdown blocks." }] }],
      generationConfig: {
        temperature: 0.7,
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

exports.generateTournamentProblems = async (numberOfProblems, difficulty) => {
  const prompt = `Generate ${numberOfProblems} unique DSA (Data Structures and Algorithms) problems of ${difficulty} difficulty level for a competitive programming tournament.
Each problem must include:
- "title": string
- "description": string (the problem statement)
- "constraints": array of strings (e.g. ["1 <= N <= 10^5"])
- "inputFormat": string
- "outputFormat": string
- "sampleInput": string
- "sampleOutput": string
- "hiddenTestCases": array of objects with "input" and "output" strings (at least 2 cases per problem)

Return a JSON object containing a 'problems' array.`;

  let result = null;

  try {
    if (process.env.OPENAI_API_KEY) {
      result = await callOpenAI(prompt);
    } else {
      throw new Error('No OpenAI key');
    }
  } catch (err) {
    console.error(`OpenAI failed: ${err.message}. Trying Gemini...`);
    try {
      result = await callGemini(prompt);
    } catch (err2) {
      console.error(`Gemini failed: ${err2.message}`);
    }
  }

  if (!result || !result.problems || !Array.isArray(result.problems)) {
    // Fallback static problems if AI fails
    console.warn("AI generation failed, using fallback problems.");
    return [
      {
        title: `Fallback ${difficulty} Problem`,
        description: `Given an array of integers, find the sum. (Fallback due to AI error)`,
        constraints: ["1 <= N <= 1000"],
        inputFormat: "First line N. Second line N integers.",
        outputFormat: "Sum of integers.",
        sampleInput: "3\n1 2 3",
        sampleOutput: "6",
        hiddenTestCases: [{ input: "2\n10 20", output: "30" }]
      }
    ];
  }

  // Cap the array just in case the AI generated too many
  return result.problems.slice(0, numberOfProblems);
};
