import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryLabel',
  standalone: true
})
export class CategoryLabelPipe implements PipeTransform {
  transform(value: unknown): string {
    const raw = String(value ?? '').trim();
    const normalized = raw.toUpperCase();

    if (normalized === 'FULL_TIME') return 'Full Time';
    if (normalized === 'PART_TIME') return 'Part Time';
    if (normalized === 'CONTRACT') return 'Contract';

    // Fallback: prettify "SOME_VALUE" -> "Some Value"
    return raw
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }
}

