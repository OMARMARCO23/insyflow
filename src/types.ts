export type Kpi = {
  key: string;
  labelKey: string; // i18n key
  value: number;
  changePct: number; // e.g., 12.3 means +12.3%
  format?: 'number' | 'time' | 'percent' | 'decimal';
};

export type UsersTrendPoint = {
  date: string; // YYYY-MM-DD
  users: number;
};

export type TrafficChannel = {
  name: string;
  value: number;
};

export type TopPage = {
  path: string;
  views: number;
  users: number;
};

export type SeoKpi = {
  key: string;
  labelKey: string;
  value: number;
  format?: 'number' | 'percent' | 'decimal';
};

export type SearchPerfPoint = {
  date: string;
  clicks: number;
  impressions: number;
};

export type TopQuery = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number; // 0..100
  position: number;
};

export type SeoPage = {
  path: string;
  clicks: number;
  impressions: number;
  ctr: number; // 0..100
  position: number;
};