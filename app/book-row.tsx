'use client';

import {useId} from 'react';
import {BookOpen, ChevronDown} from 'lucide-react';
import Image from 'next/image';
import type {Book} from './books';
import {formatPrice} from './utils/format-price';

export function BookRow({book, expanded, favorite, onExpand, onFavorite}: {
    book: Book;
    expanded: boolean;
    favorite: boolean;
    onExpand: () => void;
    onFavorite: () => void;
}) {
    const detailsId = useId();
    const sale = book.sale_price >= 0 && (book.price < 0 || book.sale_price < book.price);
    const purchase = /^https?:\/\//i.test(book.url) && (
        <a className='primary purchase' href={book.url} target='_blank' rel='noopener noreferrer'>구매하기</a>
    );
    return (
        <li className={`book-row${expanded ? ' expanded' : ''}`}>
            <div className='cover'>
                {book.thumbnail ? (
                    // 카카오 CDN에서 제공하는 작은 책 표지 썸네일을 사용합니다.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.thumbnail} alt='' loading='lazy'/>
                ) : <BookOpen size={24} aria-hidden='true'/>}
                <button className='heart' type='button' aria-pressed={favorite}
                        aria-label={`${book.title} ${favorite ? '찜 해제' : '찜하기'}`} onClick={onFavorite}>
                    <Image src={favorite ? '/fill.png' : '/line.png'} alt=''
                           width={expanded ? 22 : 15} height={expanded ? 22 : 15}/>
                </button>
            </div>
            <div className='book-name'><h2>{book.title}</h2><span>{book.authors.join(', ')}</span></div>
            {!expanded && <strong className='row-price'>{formatPrice(sale ? book.sale_price : book.price)}</strong>}
            {!expanded && purchase}
            <button className='detail-toggle' type='button' aria-expanded={expanded} aria-controls={detailsId}
                    onClick={onExpand}>
                상세보기 <ChevronDown size={16} aria-hidden='true'/>
            </button>
            <div className='book-description' id={detailsId} hidden={!expanded}>
                <strong>책 소개</strong>
                <p>{book.contents || '등록된 소개가 없습니다.'}</p>
            </div>
            {expanded && <div className='book-prices'>
                <div>
                    <small>원가</small> {sale ? <del>{formatPrice(book.price)}</del> : <strong>{formatPrice(book.price)}</strong>}
                </div>
                {sale && <div><small>할인가</small> <strong>{formatPrice(book.sale_price)}</strong></div>}
                {purchase}
            </div>}
        </li>
    );
}
