import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Categories' };

/** Canonical admin route — catalog management lives at /catalog */
export default function CategoriesPage() {
  redirect('/catalog');
}
