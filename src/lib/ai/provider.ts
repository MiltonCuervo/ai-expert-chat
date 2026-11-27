import 'server-only';
import OpenAI from 'openai';
export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export interface AIProvider { reply(prompt: string, messages: ChatMessage[]): Promise<string> }
class OpenAIProvider implements AIProvider {
 async reply(prompt: string, messages: ChatMessage[]) { if (!process.env.OPENAI_API_KEY) throw new Error('Falta OPENAI_API_KEY'); const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY}); const result = await client.chat.completions.create({model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{role:'system',content:prompt}, ...messages], max_completion_tokens: 1500}); const text = result.choices[0]?.message.content; if (!text) throw new Error('El proveedor devolvió una respuesta vacía'); return text; }
}
class GeminiProvider implements AIProvider {
 async reply(prompt: string, messages: ChatMessage[]) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith('your-') || key.startsWith('TU_')) throw new Error('Falta GEMINI_API_KEY');
  const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error('GEMINI_MODEL inválido');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
   method: 'POST', headers: {'Content-Type':'application/json','x-goog-api-key':key},
   body: JSON.stringify({systemInstruction:{parts:[{text:prompt}]}, contents:messages.map(message=>({role:message.role === 'assistant' ? 'model' : 'user',parts:[{text:message.content}]})), generationConfig:{maxOutputTokens:4096}}),
   signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) { console.error('Gemini API status:', response.status); throw new Error(response.status === 429 ? 'Gemini alcanzó el límite de solicitudes. Inténtalo más tarde.' : response.status === 404 ? 'El modelo Gemini configurado no está disponible para este proyecto. Revisa GEMINI_MODEL.' : 'No se pudo obtener una respuesta de Gemini. Revisa la clave, el modelo y la configuración del proyecto.'); }
  const result: {candidates?: Array<{content?: {parts?: Array<{text?: string; thought?: boolean}>}}> } = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.filter(part=>!part.thought).map(part=>part.text || '').join('').trim();
  if (!text) throw new Error('Gemini no devolvió texto. Intenta reformular tu pregunta.');
  return text;
 }
}
class MockProvider implements AIProvider { async reply(_prompt: string, messages: ChatMessage[]) { return `Respuesta simulada para el Taller 2. Tu pregunta fue: «${messages.at(-1)?.content ?? ''}». Activa OpenAI para obtener una respuesta real.`; } }
export function getAIProvider(): AIProvider { const provider = process.env.AI_PROVIDER || 'mock'; if (provider === 'mock') return new MockProvider(); if (provider === 'openai') return new OpenAIProvider(); if (provider === 'gemini') return new GeminiProvider(); throw new Error('Proveedor de IA no configurado'); }
