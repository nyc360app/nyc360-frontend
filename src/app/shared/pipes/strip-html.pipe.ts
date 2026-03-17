import { Pipe, PipeTransform } from '@angular/core';

/**
 * StripHtmlPipe
 * Removes all HTML tags and decodes entities from a string.
 * Usage: {{ post.content | stripHtml | slice:0:150 }}
 */
@Pipe({
    name: 'stripHtml',
    standalone: true,
    pure: true
})
export class StripHtmlPipe implements PipeTransform {
    transform(value: string | null | undefined): string {
        if (!value) return '';
        try {
            const doc = new DOMParser().parseFromString(value, 'text/html');
            return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
        } catch {
            return value
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();
        }
    }
}
