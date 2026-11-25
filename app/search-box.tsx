'use client';

import {useEffect, useRef, useState, type KeyboardEvent, type SubmitEvent} from 'react';
import {Search as SearchIcon, X} from 'lucide-react';
import {searchFields, type Search, type SearchField} from './books';

type Props = {
    history: string[];
    onRemove: (query: string) => void;
    onSearch: (search: Search) => void;
};

export function SearchBox({history, onRemove, onSearch}: Props) {
    const [input, setInput] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [activeQuery, setActiveQuery] = useState<string | null>(null);
    const [advanced, setAdvanced] = useState(false);
    const [target, setTarget] = useState<SearchField>('title');
    const [detail, setDetail] = useState('');
    const root = useRef<HTMLDivElement>(null);
    const advancedButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const closeOutside = (event: PointerEvent) => {
            if (event.target instanceof Node && !root.current?.contains(event.target)) {
                setShowHistory(false);
                setActiveQuery(null);
                setAdvanced(false);
            }
        };

        document.addEventListener('pointerdown', closeOutside);
        return () => document.removeEventListener('pointerdown', closeOutside);
    }, []);

    const submitQuery = (value: string) => {
        const query = value.trim();
        if (!query) return;
        setInput(query);
        setActiveQuery(null);
        setDetail('');
        setTarget('title');
        setShowHistory(false);
        setAdvanced(false);
        onSearch({query});
    };

    const navigateHistory = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
        if (event.key === 'Enter' && showHistory && activeQuery !== null && history.includes(activeQuery)) {
            event.preventDefault();
            submitQuery(activeQuery);
            return;
        }
        if ((event.key !== 'ArrowDown' && event.key !== 'ArrowUp') || history.length === 0) return;

        event.preventDefault();
        const index = showHistory && activeQuery !== null ? history.indexOf(activeQuery) : -1;
        const nextIndex = event.key === 'ArrowDown'
            ? (index + 1) % history.length
            : (index <= 0 ? history.length - 1 : index - 1);
        setShowHistory(true);
        setActiveQuery(history[nextIndex]);
    };

    const submitAdvanced = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = detail.trim();
        if (!query) return;
        setInput('');
        setAdvanced(false);
        advancedButton.current?.focus();
        onSearch({query, target});
    };

    return (
        <div className='search-tools' ref={root} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                setShowHistory(false);
                setActiveQuery(null);
                setAdvanced(false);
            }
        }} onKeyDown={(event) => {
            if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
                if (advanced) advancedButton.current?.focus();
                else if (showHistory) root.current?.querySelector('input')?.focus();
                setAdvanced(false);
                setShowHistory(false);
                setActiveQuery(null);
            }
        }}>
            <div className='search-box'>
                <form className='search-form' role='search' onSubmit={(event) => {
                    event.preventDefault();
                    submitQuery(input);
                }}>
                    <button type='submit' aria-label='도서 검색'><SearchIcon size={24}/></button>
                    <input aria-label='검색어' placeholder='검색어를 입력하세요' value={input}
                           onChange={(event) => {
                               setInput(event.target.value);
                               setActiveQuery(null);
                           }}
                           onKeyDown={navigateHistory}
                           onBlur={() => setActiveQuery(null)}
                           onFocus={() => {
                               setShowHistory(true);
                               setAdvanced(false);
                           }}
                           onClick={() => setShowHistory(true)}/>
                </form>
                {showHistory && history.length > 0 && (
                    <ul className='history' aria-label='최근 검색어'>
                        {history.map((query) => <li key={query}
                                                    className={activeQuery === query ? 'history-active' : undefined}>
                            <button className='history-query' onClick={() => submitQuery(query)}>{query}</button>
                            <button aria-label={`${query} 검색 기록 삭제`} onClick={() => {
                                onRemove(query);
                                root.current?.querySelector('input')?.focus();
                            }}><X size={20}/></button>
                        </li>)}
                    </ul>
                )}
                <span className='history-announcement' role='status'>
          {showHistory && activeQuery ? `최근 검색어 선택: ${activeQuery}` : ''}
        </span>
            </div>
            <div className='advanced'>
                <button className='advanced-toggle' ref={advancedButton} aria-expanded={advanced}
                        onClick={() => {
                            setShowHistory(false);
                            setAdvanced(!advanced);
                        }}>상세검색
                </button>
                {advanced && <form className='advanced-panel' aria-label='상세검색' onSubmit={submitAdvanced}>
                    <button type='button' className='close' aria-label='상세검색 닫기'
                            onClick={() => {
                                setAdvanced(false);
                                advancedButton.current?.focus();
                            }}><X size={18}/></button>
                    <div className='advanced-fields'>
                        <select aria-label='검색 조건' value={target}
                                onChange={(event) => setTarget(event.target.value as SearchField)}>
                            {Object.entries(searchFields).map(([value, label]) => <option key={value}
                                                                                          value={value}>{label}</option>)}
                        </select>
                        <input aria-label='상세 검색어' placeholder='검색어 입력' value={detail}
                               onChange={(event) => setDetail(event.target.value)} autoFocus/>
                    </div>
                    <button className='primary' type='submit'>검색하기</button>
                </form>}
            </div>
        </div>
    );
}
