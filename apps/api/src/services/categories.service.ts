import { Prisma, type Category, type PrismaClient } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler.js';

export interface CategoryInput {
  name: string;
  slug: string;
}

export async function listCategories(prisma: PrismaClient): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(
  prisma: PrismaClient,
  input: CategoryInput,
): Promise<Category> {
  try {
    return await prisma.category.create({ data: input });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'Category with this slug already exists');
    }
    throw err;
  }
}

export async function updateCategory(
  prisma: PrismaClient,
  id: string,
  input: Partial<CategoryInput>,
): Promise<Category> {
  try {
    return await prisma.category.update({ where: { id }, data: input });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') throw new HttpError(404, 'Category not found');
      if (err.code === 'P2002') throw new HttpError(409, 'Category with this slug already exists');
    }
    throw err;
  }
}

export async function deleteCategory(prisma: PrismaClient, id: string): Promise<void> {
  try {
    await prisma.category.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new HttpError(404, 'Category not found');
    }
    throw err;
  }
}
