import type { RetrievedContext } from './types';

/** Truncate text to maxLength characters */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/** Format a source citation string */
export function formatSourceCitation(chunk: { pageNumber: number; chapter: string; section: string }): string {
  return `Manual trang ${chunk.pageNumber}: ${chunk.chapter} > ${chunk.section}`;
}

/** Detect query category from keywords */
export function detectQueryCategory(query: string): string {
  const q = query.toLowerCase();
  if (/đèn|cảnh báo|warning|taplo|dashboard/i.test(q)) return 'warning';
  if (/sạc|pin|charging|battery|range/i.test(q)) return 'charging';
  if (/adas|lane|cruise|aeb|blind spot|giữ làn|phanh khẩn/i.test(q)) return 'adas';
  if (/bảo dưỡng|maintenance|dầu|lốp|service/i.test(q)) return 'maintenance';
  if (/safety|an toàn|airbag|thoát hiểm/i.test(q)) return 'safety';
  if (/thông số|specification|kg|km|hp|torque|kích thước/i.test(q)) return 'specification';
  if (/vận hành|operation|lái|đỗ|khởi động|mở cốp/i.test(q)) return 'operation';
  return 'general';
}

/** Check if a query is related to VinFast/cars */
export function isOffTopic(query: string): boolean {
  const q = query.toLowerCase();
  const carKeywords = [
    'vinfast', 'vf 8', 'vf 9', 'vf8', 'vf9', 'xe', 'ô tô', 'oto', 'electric vehicle',
    'ev', 'pin', 'sạc', 'đèn', 'phanh', 'lốp', 'adas', 'bảo dưỡng', 'tính năng',
    'manual', 'hướng dẫn', 'taplo', 'cần z', 'cần bạn', 'chỉ báo', 'cảnh báo',
    'lái xe', ' lái ', 'parking', 'reverse', 'drive', 'sport', 'eco',
  ];
  return !carKeywords.some((kw) => q.includes(kw));
}

/** Estimate confidence based on retrieved context */
export function estimateConfidence(contexts: RetrievedContext[]): number {
  if (!contexts || contexts.length === 0) return 0;
  return Math.min(1, (contexts[0]?.score ?? 0) * 2.5);
}
