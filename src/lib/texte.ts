// Nettoyage du texte mis en forme saisi dans l'administration (articles).
// Seules les balises de mise en forme simples sont gardées ; tout script ou style est retiré.
import sanitizeHtml from 'sanitize-html';

export function texteSur(html?: string): string {
  return sanitizeHtml(html ?? '', {
    allowedTags: ['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'br', 'blockquote'],
    allowedAttributes: { a: ['href', 'rel', 'target'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    transformTags: {
      a: (tag, attrs) => ({
        tagName: 'a',
        attribs: /^https?:/.test(attrs.href ?? '') && !(attrs.href ?? '').includes('asblcommecheznous')
          ? { ...attrs, rel: 'noopener', target: '_blank' } : attrs,
      }),
    },
  });
}
