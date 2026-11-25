import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import './globals.css';

export const metadata: Metadata = {
    title: 'CERTICOS BOOKS',
    description: '도서를 검색하고 관심 있는 책을 모아보세요.',
};

export default function RootLayout({children}: { children: ReactNode }) {
    return <html lang='ko'><body>{children}</body></html>;
}
