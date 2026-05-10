import type { Category, CourseDetail, CourseSummary } from '@psich/types';
import { API_BASE_URL } from './api';

/**
 * Server- and client-safe fetchers for the public courses API.
 * These intentionally do NOT go through `apiFetch` because public reads
 * shouldn't carry the Authorization header or trigger refresh attempts.
 */

export interface ListCoursesParams {
  category?: string;
  search?: string;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listCourses(params: ListCoursesParams = {}): Promise<CourseSummary[]> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.search) search.set('search', params.search);
  const qs = search.toString();
  const data = await fetchJson<{ items: CourseSummary[] }>(`/api/courses${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
  return data.items;
}

export async function getCourseBySlug(slug: string): Promise<CourseDetail | null> {
  const res = await fetch(`${API_BASE_URL}/api/courses/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load course ${slug}: ${res.status}`);
  const data = (await res.json()) as { item: CourseDetail };
  return data.item;
}

export async function listCategories(): Promise<Category[]> {
  const data = await fetchJson<{ items: Category[] }>('/api/categories', { cache: 'no-store' });
  return data.items;
}

export function formatUah(value: number): string {
  return `${value.toLocaleString('uk-UA').replace(/,/g, ' ')} ₴`;
}
