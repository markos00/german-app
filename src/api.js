const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]);
    throw new Error("Invalid JSON format from AI");
  }
};

export const fetchGemini = async (prompt) => {
  if (!API_KEY) throw new Error("Missing API Key");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!response.ok) throw new Error("API Error");
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

export const fetchGeminiJSON = async (prompt) => {
  const text = await fetchGemini(prompt + " \nReturn ONLY valid JSON. No markdown.");
  const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return parseJSON(cleanText);
};

export const fetchGeminiTTS = async (text) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
            }
          }
        }),
      }
    );
    if (!response.ok) throw new Error("TTS Error");
    const data = await response.json();
    const inlineData = data.candidates[0].content.parts[0].inlineData;
    
    // Convert Base64 to Blob
    const byteCharacters = atob(inlineData.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'audio/wav' });
  } catch (error) {
    console.error("TTS Failed", error);
    return null;
  }
};