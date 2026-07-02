type PaginatedRangePage<T> = {
  data: T[] | null;
  error: unknown;
};

type FetchAllRowsByRangeOptions<T> = {
  queryName: string;
  fetchPage: (from: number, to: number) => Promise<PaginatedRangePage<T>>;
  pageSize?: number;
  maxPages?: number;
};

export async function fetchAllRowsByRange<T>({
  queryName,
  fetchPage,
  pageSize = 1000,
  maxPages = 10_000,
}: FetchAllRowsByRangeOptions<T>) {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error(`invalid_page_size_for_${queryName}`);
  }

  if (!Number.isInteger(maxPages) || maxPages <= 0) {
    throw new Error(`invalid_max_pages_for_${queryName}`);
  }

  const rows: T[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await fetchPage(from, to);

    if (error) {
      throw error;
    }

    const batch = data ?? [];
    rows.push(...batch);

    if (batch.length < pageSize) {
      return rows;
    }
  }

  throw new Error(`pagination_limit_reached_for_${queryName}`);
}
