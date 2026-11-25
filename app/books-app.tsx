'use client';

import {useEffect, useState} from 'react';
import {QueryClient, QueryClientProvider, useQuery} from '@tanstack/react-query';
import Image from 'next/image';
import {BookRow} from './book-row';
import {SearchBox} from './search-box';
import {fetchBooks} from './api/books-client';
import {bookId, MAX_PAGE, PAGE_SIZE, type Book, type Search} from './books';

function useStoredList<T>(key: string) {
    const [items, setItems] = useState<T[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const data: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
            if (Array.isArray(data)) setItems(data);
        } catch {
            // 저장소에 접근할 수 없거나 저장된 값을 읽을 수 없으면 빈 목록으로 시작합니다.
        }
        setLoaded(true);
    }, [key]);

    useEffect(() => {
        if (!loaded) return;
        try {
            localStorage.setItem(key, JSON.stringify(items));
        } catch {
            // 저장에 실패해도 현재 페이지에서는 메모리에 있는 목록을 사용할 수 있습니다.
        }
    }, [items, key, loaded]);

    return [items, setItems, loaded] as const;
}

function Catalogue() {
    const [tab, setTab] = useState<'search' | 'favorites'>('search');
    const [search, setSearch] = useState<Search | null>(null);
    const [searchPage, setSearchPage] = useState(1);
    const [favoritesPage, setFavoritesPage] = useState(1);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [history, setHistory] = useStoredList<string>('certicos-search-history');
    const [favorites, setFavorites, favoritesLoaded] = useStoredList<Book>('certicos-favorites');
    const result = useQuery({
        queryKey: ['books', search, searchPage],
        enabled: search !== null && tab === 'search',
        queryFn: ({signal}) => fetchBooks(search!, searchPage, signal),
    });

    const isFavorites = tab === 'favorites';
    const favoritesMax = Math.max(1, Math.ceil(favorites.length / PAGE_SIZE));
    const page = isFavorites ? Math.min(favoritesPage, favoritesMax) : searchPage;
    const books = isFavorites
        ? favorites.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        : result.data?.documents ?? [];
    const total = isFavorites ? favorites.length : result.data?.meta.total_count ?? 0;
    const max = isFavorites ? favoritesMax : Math.min(MAX_PAGE, Math.ceil((result.data?.meta.pageable_count ?? 0) / PAGE_SIZE));
    const loading = isFavorites ? !favoritesLoaded : search !== null && result.isPending;
    const error = !isFavorites && result.isError && !result.data ? result.error : null;
    const favoriteIds = new Set(favorites.map(bookId));

    const runSearch = (next: Search) => {
        setSearch(next);
        setSearchPage(1);
        setExpanded(null);
        if (!next.target) setHistory((items) => [next.query, ...items.filter((query) => query !== next.query)].slice(0, 8));
    };

    const movePage = (next: number) => {
        if (isFavorites) setFavoritesPage(next);
        else setSearchPage(next);
        setExpanded(null);
    };

    return <>
        <header className='header'>
            <a className='brand' href='/'>CERTICOS BOOKS</a>
            <nav aria-label='주 메뉴'>
                <button aria-current={!isFavorites ? 'page' : undefined} onClick={() => {
                    setTab('search');
                    setExpanded(null);
                }}>도서 검색
                </button>
                <button aria-current={isFavorites ? 'page' : undefined} onClick={() => {
                    setTab('favorites');
                    setExpanded(null);
                }}>내가 찜한 책
                </button>
            </nav>
        </header>
        <main>
            <h1>{isFavorites ? '내가 찜한 책' : '도서 검색'}</h1>
            <div hidden={isFavorites}>
                <SearchBox history={history} onSearch={runSearch}
                           onRemove={(query) => setHistory((items) => items.filter((item) => item !== query))}/>
            </div>
            <div className='count' aria-live='polite'>
                <span>{isFavorites ? '찜한 책' : '도서 검색 결과'}</span>
                <span>총 <b>{total.toLocaleString('ko-KR')}</b>건</span>
            </div>
            {loading ? <p className='status' role='status'>불러오는 중입니다.</p>
                : error ? <div className='status'><p role='alert'>{error.message}</p>
                        <button className='primary' onClick={() => void result.refetch()}>다시 시도</button>
                    </div>
                    : books.length === 0 ? <div className='empty'>
                        <Image src='/icon_book.png' alt='' width={80} height={80} priority/>
                        <p>{isFavorites ? '찜한 책이 없습니다.' : '검색된 결과가 없습니다.'}</p>
                    </div> : <ul className='book-list'>
                        {books.map((book, index) => {
                            const id = bookId(book);
                            const rowId = `${id}-${index}`;
                            return <BookRow key={rowId} book={book} expanded={expanded === rowId}
                                            favorite={favoriteIds.has(id)}
                                            onExpand={() => setExpanded(expanded === rowId ? null : rowId)}
                                            onFavorite={() => {
                                                if (isFavorites) {
                                                    setFavoritesPage(page);
                                                    setExpanded(null);
                                                }
                                                setFavorites((items) => items.some((item) => bookId(item) === id)
                                                    ? items.filter((item) => bookId(item) !== id) : [book, ...items]);
                                            }}/>;
                        })}
                    </ul>}
            {(page > 1 || max > 1) && <div className='pagination' aria-label='페이지 이동'>
                <button onClick={() => movePage(page - 1)} disabled={page <= 1}>이전</button>
                <span aria-live='polite'>{page} / {max || '…'}</span>
                <button onClick={() => movePage(page + 1)}
                        disabled={page >= max || (!isFavorites && result.data?.meta.is_end)}>다음
                </button>
            </div>}
        </main>
    </>;
}

export function BooksApp() {
    const [client] = useState(() => new QueryClient({
        defaultOptions: {queries: {staleTime: 60_000, retry: false, refetchOnWindowFocus: false}},
    }));
    return (
        <QueryClientProvider client={client}>
            <Catalogue/>
        </QueryClientProvider>
    );
}
