import { MAX_PAGE, PAGE_SIZE, searchFields, type BookPage } from '../../books';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get('query')?.trim();
  const target = params.get('target');
  const page = Number(params.get('page') ?? 1);

  if (!query || !Number.isInteger(page) || page < 1 || page > MAX_PAGE ||
      (target !== null && !Object.hasOwn(searchFields, target))) {
    return Response.json({ message: '검색 조건을 확인해 주세요.' }, { status: 400 });
  }

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    return Response.json({ message: '서버의 카카오 API 키 설정을 확인해 주세요.' }, { status: 503 });
  }

  const url = new URL('https://dapi.kakao.com/v3/search/book');
  url.search = new URLSearchParams({ query, page: String(page), size: String(PAGE_SIZE) }).toString();
  if (target) url.searchParams.set('target', target);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(8000)]),
      cache: 'no-store',
    });
    if (!response.ok) {
      const message = response.status === 429
        ? '검색 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.'
        : '카카오 도서 검색에 실패했습니다.';
      return Response.json({ message }, { status: response.status === 429 ? 429 : 502 });
    }
    return Response.json(await response.json() as BookPage);
  } catch {
    return Response.json({ message: '도서 검색에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}
