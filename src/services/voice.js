import api from './api';

// Sends one recording to the server. Returns { url, duration, bytes }.
export const uploadVoice = async (blob) => {
  const type = String(blob.type || '');
  const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';

  const form = new FormData();
  form.append('voice', blob, `voice.${ext}`);

  // Do not set Content-Type by hand: the browser adds the correct boundary itself
  const response = await api.post('/voice', form, { timeout: 60000 });
  return response.data.data;
};
// Best effort: ask the server to remove the audio file of a deleted voice message.
// The message is already deleted in the chat even if this request fails.
export const removeVoiceFile = async (url) => {
  try {
    await api.delete('/voice', { data: { url } });
  } catch {
    /* ignore */
  }
};
