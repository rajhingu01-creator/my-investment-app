import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateGujuBotImage = async (action: string = "smiling") => {
  const actionPrompts: Record<string, string> = {
    smiling: "smiling and waving friendly",
    eating: "happily eating a Dorayaki (bean jam pancake)",
    flying: "flying in the air using a Bamboo-copter (Take-copter) on his head",
    gadget: "holding a futuristic glowing gadget from his 4D pocket",
    dancing: "happily dancing and celebrating",
  };

  const selectedAction = actionPrompts[action] || actionPrompts.smiling;

  const prompt = `A high-quality 3D CGI render of the original Doraemon character. Pixar/Disney style, soft rounded shapes, realistic textures, vibrant colors. Doraemon is ${selectedAction}. He has a blue robotic body, round white face, big expressive eyes, small red nose, white belly pocket with a 4D bell, and a yellow bell on his red collar. The background is a modern, cozy Indian bedroom with soft cinematic lighting. 8k resolution, ultra-detailed, masterpiece.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const getGujuResponse = async (userMessage: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: userMessage,
    config: {
      systemInstruction: "You are 'Doraemon', the famous robotic cat from the future. You are intelligent, helpful, and always speak in Gujarati. Your tone is cheerful and encouraging. You love futuristic gadgets (gadgets from your 4D pocket) and Indian culture. Keep your responses concise and friendly.",
    },
  });
  return response.text;
};

function addWavHeader(base64Pcm: string, sampleRate: number = 24000): string {
  const pcmData = Uint8Array.from(atob(base64Pcm), c => c.charCodeAt(0));
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmData.length;
  
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate
  view.setUint32(28, byteRate, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, dataSize, true);
  
  const wavBuffer = new Uint8Array(44 + dataSize);
  wavBuffer.set(new Uint8Array(header), 0);
  wavBuffer.set(pcmData, 44);
  
  let binary = '';
  const bytes = new Uint8Array(wavBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export const generateSpeech = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say in a high-pitched, cheerful, and slightly robotic voice like a cute anime character (Doraemon style) in Gujarati: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return addWavHeader(base64Audio);
  }
  return null;
};
