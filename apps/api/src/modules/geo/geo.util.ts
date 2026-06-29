export function slugifyOperationalCity(name: string, state: string): string {
  return `${name}-${state}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}
