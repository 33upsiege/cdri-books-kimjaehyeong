const won = new Intl.NumberFormat('ko-KR');

export const formatPrice = (value: number): string => {
    return value >= 0 ? `${won.format(value)}원` : '가격 정보 없음';
};
