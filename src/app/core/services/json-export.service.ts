import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JsonExportService {
  download(filename: string, data: unknown): void {
    const file = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(file);
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
