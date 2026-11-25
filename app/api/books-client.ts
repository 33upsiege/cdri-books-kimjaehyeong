import type {BookPage, Search} from '../books';

export const fetchBooks = async (search: Search, page: number, signal: AbortSignal): Promise<BookPage> => {
    const params = new URLSearchParams({query: search.query, page: String(page)});
    if (search.target) params.set('target', search.target);
    const response = await fetch(`/api/books?${params}`, {signal});
    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message ?? '검색 결과를 불러오지 못했습니다.');
    }
    return response.json();
};
