import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly cache = new Map<string, string>();

  async translateEnglishToVietnamese(text: string): Promise<string> {
    const normalized = text.trim();
    const cached = this.cache.get(normalized);
    if (cached) {
      return cached;
    }

    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', normalized);
    url.searchParams.set('langpair', 'en|vi');

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new Error(
        `Could not reach the translation service. Check your connection and try again. ${error instanceof Error ? error.message : ''}`.trim(),
      );
    }

    if (!response.ok) {
      throw new Error(`Translation request failed (${response.status}).`);
    }

    const result: unknown = await response.json();
    if (
      typeof result !== 'object' ||
      result === null ||
      !('responseStatus' in result) ||
      result.responseStatus !== 200 ||
      !('responseData' in result) ||
      typeof result.responseData !== 'object' ||
      result.responseData === null ||
      !('translatedText' in result.responseData) ||
      typeof result.responseData.translatedText !== 'string' ||
      !result.responseData.translatedText.trim()
    ) {
      throw new Error('The translation service did not return a translation.');
    }

    const translated = result.responseData.translatedText;
    this.cache.set(normalized, translated);
    return translated;
  }
}
