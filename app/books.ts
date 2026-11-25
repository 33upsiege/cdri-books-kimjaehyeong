export const PAGE_SIZE = 10;
export const MAX_PAGE = 50;

export const searchFields = {
  title: '제목',
  person: '저자명',
  publisher: '출판사',
} as const;

export type SearchField = keyof typeof searchFields;
export type Search = { query: string; target?: SearchField };

export type Book = {
  title: string;
  authors: string[];
  isbn: string;
  url: string;
  thumbnail: string;
  contents: string;
  price: number;
  sale_price: number;
};

export type BookPage = {
  documents: Book[];
  meta: { total_count: number; pageable_count: number; is_end: boolean };
};

export function bookId(book: Book) {
  return book.isbn.trim().split(/\s+/).at(-1) || book.url || JSON.stringify([book.title, book.authors]);
}
