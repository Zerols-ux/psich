// Тимчасові мок-дані — будуть замінені на дані з API у Phase 2.

export interface MockCourse {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  price: number;
  lessonsCount: number;
  icon: string;
  hasFreeLessons: boolean;
}

export const MOCK_CATEGORIES = [
  'Всі',
  'Самопізнання',
  'Стосунки',
  'Тривога та стрес',
  'Травма',
] as const;

export const MOCK_COURSES: MockCourse[] = [
  {
    id: 'arch-personality',
    slug: 'architectura-osobystosti',
    title: 'Архітектура особистості',
    category: 'Самопізнання',
    description: 'Глибоке занурення у власну психіку. 8 модулів практичної роботи.',
    price: 2800,
    lessonsCount: 24,
    icon: '🧠',
    hasFreeLessons: false,
  },
  {
    id: 'healthy-boundaries',
    slug: 'zdorovi-mezhi',
    title: 'Здорові межі',
    category: 'Стосунки',
    description: 'Як будувати стосунки без втрати себе. Практичні техніки.',
    price: 1900,
    lessonsCount: 16,
    icon: '💜',
    hasFreeLessons: false,
  },
  {
    id: 'inner-calm',
    slug: 'spokiy-zseredyny',
    title: 'Спокій зсередини',
    category: 'Тривога та стрес',
    description: 'Інструменти для роботи з тривогою та панічними атаками.',
    price: 2200,
    lessonsCount: 20,
    icon: '✨',
    hasFreeLessons: true,
  },
  {
    id: 'trauma-roots',
    slug: 'korin-travmy',
    title: 'Корінь травми',
    category: 'Травма',
    description: 'Робота з дитячими травмами через тілесні та когнітивні практики.',
    price: 3200,
    lessonsCount: 18,
    icon: '🌱',
    hasFreeLessons: false,
  },
  {
    id: 'self-discovery',
    slug: 'shliakh-do-sebe',
    title: 'Шлях до себе',
    category: 'Самопізнання',
    description: 'Поетапна програма для тих, хто шукає сенс і власні цінності.',
    price: 2400,
    lessonsCount: 22,
    icon: '🪞',
    hasFreeLessons: true,
  },
  {
    id: 'relationships-101',
    slug: 'osnovy-stosunkiv',
    title: 'Основи здорових стосунків',
    category: 'Стосунки',
    description: 'Прив’язаності, конфлікти, комунікація. 12 годин відеолекцій.',
    price: 1700,
    lessonsCount: 14,
    icon: '🫂',
    hasFreeLessons: false,
  },
];

export const formatUah = (value: number): string =>
  `${value.toLocaleString('uk-UA').replace(/,/g, ' ')} ₴`;
