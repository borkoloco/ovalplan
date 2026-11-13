export type Category = {
  id: string
  /** Número usado para comparar con Exercise.minAge. */
  age: number
}

/** Categorías como se usan en Argentina: M6 = menores de 6, etc. */
export const CATEGORIES: Category[] = [
  { id: 'M6', age: 6 },
  { id: 'M7', age: 7 },
  { id: 'M8', age: 8 },
  { id: 'M9', age: 9 },
  { id: 'M10', age: 10 },
  { id: 'M11', age: 11 },
  { id: 'M12', age: 12 },
  { id: 'M13', age: 13 },
  { id: 'M14', age: 14 },
  { id: 'M15', age: 15 },
  { id: 'M16', age: 16 },
  { id: 'M17', age: 17 },
  { id: 'M19', age: 19 },
  { id: 'senior', age: 20 },
]

export function categoryAge(id: string): number {
  return CATEGORIES.find((c) => c.id === id)?.age ?? 20
}

/** Primera categoría que cumple la edad mínima de un ejercicio. */
export function categoryForMinAge(minAge: number): Category {
  return CATEGORIES.find((c) => c.age >= minAge) ?? CATEGORIES[CATEGORIES.length - 1]
}
