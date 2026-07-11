-- 株式指標通知サービス 初期スキーマ(フェーズ2: Supabase移行時に適用)
-- batch/storage.py の SQLite スキーマと対応関係を保つこと

-- ユーザー拡張情報(Supabase auth.users と 1:1)
create table profiles (
  id uuid primary key references auth.users,
  line_user_id text unique,
  plan text not null default 'free',  -- 'free' | 'paid'
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- 銘柄マスタ
create table stocks (
  code text primary key,
  name text not null,
  market text,
  updated_at timestamptz default now()
);

-- 日足株価(調整済み)
create table daily_prices (
  code text references stocks,
  date date,
  open numeric, high numeric, low numeric, close numeric,
  volume bigint,
  primary key (code, date)
);

-- 計算済み指標(日次)
create table daily_indicators (
  code text references stocks,
  date date,
  rsi14 numeric,
  sma5 numeric, sma25 numeric, sma75 numeric, sma200 numeric,
  volume_ratio20 numeric,
  macd numeric, macd_signal numeric,
  bb_upper numeric, bb_lower numeric,
  stoch_k numeric, stoch_d numeric,
  kairi25 numeric,
  tenkan numeric, kijun numeric, senkou_a numeric, senkou_b numeric,
  atr14 numeric,
  primary key (code, date)
);

-- シグナル定義(マスタ)。batch/signals のレジストリから seed する
create table signal_types (
  id text primary key,
  name text not null,
  description text not null,      -- 中立的な定義文
  origin text,                    -- 由来の教育的説明
  category text not null default 'classic',  -- classic|sakata|legend|anomaly
  is_premium boolean default false
);

-- シグナル検知履歴(return_* は検知日終値→N営業日後終値の実績)
create table signal_events (
  id bigint generated always as identity primary key,
  code text references stocks,
  signal_type text references signal_types,
  date date not null,
  detail jsonb,
  return_1d_pct numeric, return_1d_yen numeric,
  return_2d_pct numeric, return_2d_yen numeric,
  return_3d_pct numeric, return_3d_yen numeric,
  created_at timestamptz default now(),
  unique (code, signal_type, date)
);
create index idx_signal_events_date on signal_events (date desc);
create index idx_signal_events_code on signal_events (code, date desc);

-- シグナル別過去統計(バッチが事前計算)
create table signal_stats (
  signal_type text references signal_types,
  hold_days integer,
  count integer,
  up_count integer,
  down_count integer,
  up_ratio_pct numeric,
  mean_return_pct numeric,
  median_return_pct numeric,
  max_gain_pct numeric,
  max_loss_pct numeric,
  histogram jsonb,
  recent_occurrences jsonb,
  updated_at timestamptz default now(),
  primary key (signal_type, hold_days)
);

-- 相場の暦・アノマリーイベント(市場全体、銘柄非依存)
create table calendar_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  date date not null,
  title text not null,
  body text not null,
  unique (event_type, date)
);

-- 決算発表予定
create table earnings_schedule (
  code text references stocks,
  announce_date date,
  fiscal_quarter text,
  primary key (code, announce_date)
);

-- ユーザーの監視銘柄
create table watchlists (
  user_id uuid references profiles,
  code text references stocks,
  created_at timestamptz default now(),
  primary key (user_id, code)
);

-- ユーザーの通知設定
create table notification_settings (
  user_id uuid references profiles,
  signal_type text references signal_types,
  enabled boolean default true,
  custom_threshold numeric,       -- 有料会員のみ閾値カスタム可
  primary key (user_id, signal_type)
);

-- 通知送信ログ(重複送信防止・監査用)
create table notification_logs (
  id bigint generated always as identity primary key,
  user_id uuid references profiles,
  signal_event_id bigint references signal_events,
  channel text default 'line',
  sent_at timestamptz default now(),
  unique (user_id, signal_event_id)
);

-- ニュースリンク
create table news_links (
  id bigint generated always as identity primary key,
  title text not null,
  url text not null unique,
  source_name text not null,
  published_at timestamptz,
  tags jsonb default '[]',
  created_at timestamptz default now()
);
create index idx_news_published on news_links (published_at desc);

-- Row Level Security
alter table profiles enable row level security;
alter table stocks enable row level security;
alter table daily_prices enable row level security;
alter table daily_indicators enable row level security;
alter table signal_types enable row level security;
alter table signal_events enable row level security;
alter table signal_stats enable row level security;
alter table calendar_events enable row level security;
alter table earnings_schedule enable row level security;
alter table watchlists enable row level security;
alter table notification_settings enable row level security;
alter table notification_logs enable row level security;
alter table news_links enable row level security;

-- 本人のみ読み書き可(ユーザーデータ)
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own watchlist" on watchlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on notification_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own logs" on notification_logs
  for select using (auth.uid() = user_id);

-- マスタ・共有データは全員読み取り可(書き込みは service role のみ =
-- RLS 有効時に anon/authenticated への insert/update ポリシーを作らない)
create policy "public read stocks" on stocks for select using (true);
create policy "public read prices" on daily_prices for select using (true);
create policy "public read indicators" on daily_indicators for select using (true);
create policy "public read signal_types" on signal_types for select using (true);
create policy "public read signal_events" on signal_events for select using (true);
create policy "public read signal_stats" on signal_stats for select using (true);
create policy "public read calendar" on calendar_events for select using (true);
create policy "public read earnings" on earnings_schedule for select using (true);
create policy "public read news" on news_links for select using (true);
