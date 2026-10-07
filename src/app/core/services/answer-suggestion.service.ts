import { Injectable, signal } from '@angular/core';

const API_KEY_STORAGE_KEY = 'english-practice.groq-api-key.v1';
const CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AnswerSuggestionService {
  readonly apiKey = signal(this.readStoredKey());

  saveApiKey(apiKey: string): void {
    const normalized = apiKey.trim();
    if (normalized) {
      localStorage.setItem(API_KEY_STORAGE_KEY, normalized);
      this.apiKey.set(normalized);
      return;
    }
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    this.apiKey.set('');
  }

  async suggestAnswer(
    question: string,
    referenceAnswer: string,
    imageUrl?: string,
  ): Promise<string> {
    const apiKey = this.apiKey();
    if (!apiKey) {
      throw new Error('Add your Groq API key in the practice settings first.');
    }

    const content: Array<Record<string, unknown>> = [
      {
        type: 'text',
        text: [
          'You are an English tutor. Suggest one concise, natural English answer to the question.',
          'Do not copy the reference answer verbatim; express the same correct information in a different way.',
          'Keep the response suitable for a language learner. Return only the suggested answer, with no explanation or quotation marks.',
          `Question: ${question}`,
          referenceAnswer ? `Reference answer for factual guidance: ${referenceAnswer}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ];

    if (imageUrl) {
      content.push({ type: 'image_url', image_url: { url: imageUrl } });
    }

    return this.requestSuggestion(content);
  }

  async suggestAnswerStructure(
    question: string,
    referenceAnswer: string,
    imageUrl?: string,
  ): Promise<string> {
    const apiKey = this.apiKey();
    if (!apiKey) {
      throw new Error('Add your Groq API key in the practice settings first.');
    }

    const content: Array<Record<string, unknown>> = [
      {
        type: 'text',
        text: [
          'You are a friendly English speaking tutor helping a Vietnamese learner.',
          'Explain in Vietnamese how to answer this specific question, and provide useful English sentence starters plus one short, natural sample answer in English.',
          'Adapt the structure to the question type. For open prompts such as "Tell me about..." or "Talk about...", teach a simple structure: introduce the topic, add 2-3 relevant details, then give a feeling or reason. Do not force that structure onto short factual questions.',
          'Use the reference answer only to keep the sample factually aligned; do not copy it verbatim.',
          'Use these concise headings: Cấu trúc trả lời, Cụm từ gợi ý, Ví dụ. Keep the whole response brief and do not answer unrelated questions.',
          `Câu hỏi: ${question}`,
          referenceAnswer ? `Đáp án tham khảo để giữ đúng thông tin: ${referenceAnswer}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ];

    if (imageUrl) {
      content.push({ type: 'image_url', image_url: { url: imageUrl } });
    }

    return this.requestSuggestion(content);
  }

  private async requestSuggestion(content: Array<Record<string, unknown>>): Promise<string> {
    const apiKey = this.apiKey();
    if (!apiKey) {
      throw new Error('Add your Groq API key in the practice settings first.');
    }

    let response: Response;
    try {
      response = await fetch(CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [{ role: 'user', content }],
          temperature: 0.8,
          max_completion_tokens: 200,
        }),
      });
    } catch (error) {
      throw new Error(
        `Could not reach Groq. Check your internet connection and try again. ${error instanceof Error ? error.message : ''}`.trim(),
      );
    }

    const result = (await response.json()) as GroqResponse;
    if (!response.ok) {
      throw new Error(result.error?.message || `Groq request failed (${response.status}).`);
    }

    const output = result.choices?.[0]?.message?.content;
    const suggestion = typeof output === 'string'
      ? output.trim()
      : output?.filter((part) => part.type === 'text').map((part) => part.text ?? '').join('').trim();
    if (!suggestion) {
      throw new Error('Groq did not return a suggested answer. Please try again.');
    }
    return suggestion;
  }

  private readStoredKey(): string {
    return localStorage.getItem(API_KEY_STORAGE_KEY) ?? '';
  }
}
