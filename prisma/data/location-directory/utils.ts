export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeLocationText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function aliasVariants(label: string): string[] {
  const base = label.trim();
  const variants = new Set<string>([base]);
  variants.add(base.replace(/\s+/g, ''));
  variants.add(base.replace(/\bExt\b\.?/gi, 'Extension'));
  variants.add(base.replace(/\bExtension\b/gi, 'Ext'));
  variants.add(base.replace(/\bGurgaon\b/gi, 'Gurugram'));
  variants.add(base.replace(/\bGurugram\b/gi, 'Gurgaon'));
  variants.add(base.replace(/\bNagar\b/gi, 'Nagar'));
  if (base.includes(' ')) {
    variants.add(base.replace(/\s+/g, ' ').replace(/\bNagar\b/gi, ' Nagar'));
  }
  return [...variants].filter(Boolean);
}
