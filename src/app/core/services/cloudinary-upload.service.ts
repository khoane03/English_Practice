import { Injectable, signal } from '@angular/core';
import { cloudinaryEnvironment } from '../config/cloudinary.config.generated';

export interface CloudinaryUploadSettings {
  cloudName: string;
  uploadPreset: string;
}

const SETTINGS_STORAGE_KEY = 'english-practice.cloudinary-settings.v1';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const environmentIsConfigured = Boolean(
  cloudinaryEnvironment.cloudName && cloudinaryEnvironment.uploadPreset,
);

@Injectable({ providedIn: 'root' })
export class CloudinaryUploadService {
  readonly settings = signal<CloudinaryUploadSettings>(this.readSettings());

  saveSettings(settings: CloudinaryUploadSettings): void {
    if (environmentIsConfigured) {
      throw new Error('Cloudinary upload settings are managed by the app environment.');
    }
    const normalized = {
      cloudName: settings.cloudName.trim(),
      uploadPreset: settings.uploadPreset.trim(),
    };
    if (!normalized.cloudName || !normalized.uploadPreset) {
      throw new Error('Enter both the Cloudinary cloud name and unsigned upload preset.');
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    this.settings.set(normalized);
  }

  async upload(file: File): Promise<string> {
    const { cloudName, uploadPreset } = this.settings();
    if (!cloudName || !uploadPreset) {
      throw new Error('Save your Cloudinary cloud name and unsigned upload preset first.');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
      throw new Error('The Cloudinary cloud name contains invalid characters.');
    }
    if (!file.type.startsWith('image/')) {
      throw new Error('Choose an image file to upload.');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('Choose an image smaller than 10 MB.');
    }

    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', uploadPreset);

    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
        { method: 'POST', body: form },
      );
    } catch (error) {
      throw new Error(
        `Could not connect to Cloudinary. Check your connection and try again. ${error instanceof Error ? error.message : ''}`.trim(),
      );
    }

    const result: unknown = await response.json();
    if (!response.ok) {
      const message =
        typeof result === 'object' &&
        result !== null &&
        'error' in result &&
        typeof result.error === 'object' &&
        result.error !== null &&
        'message' in result.error &&
        typeof result.error.message === 'string'
          ? result.error.message
          : `Cloudinary upload failed (${response.status}).`;
      throw new Error(message);
    }

    if (
      typeof result !== 'object' ||
      result === null ||
      !('secure_url' in result) ||
      typeof result.secure_url !== 'string'
    ) {
      throw new Error('Cloudinary did not return a secure image URL.');
    }

    const uploadedUrl = new URL(result.secure_url);
    if (uploadedUrl.protocol !== 'https:' || uploadedUrl.hostname !== 'res.cloudinary.com') {
      throw new Error('Cloudinary returned an unexpected image URL.');
    }
    return uploadedUrl.toString();
  }

  private readSettings(): CloudinaryUploadSettings {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return cloudinaryEnvironment;
    }

    try {
      const parsed: unknown = JSON.parse(stored);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'cloudName' in parsed &&
        typeof parsed.cloudName === 'string' &&
        'uploadPreset' in parsed &&
        typeof parsed.uploadPreset === 'string'
      ) {
        return {
          cloudName: parsed.cloudName || cloudinaryEnvironment.cloudName,
          uploadPreset: parsed.uploadPreset || cloudinaryEnvironment.uploadPreset,
        };
      }
    } catch (error) {
      console.error('Saved Cloudinary upload settings could not be read.', error);
    }
    return { cloudName: '', uploadPreset: '' };
  }
}
