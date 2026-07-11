-- ビュー(Web の読み取りを単純化)+ 認証まわりの自動化

-- サインアップ時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 監視銘柄の上限(50銘柄)
create or replace function public.check_watchlist_limit()
returns trigger
language plpgsql as $$
begin
  if (select count(*) from watchlists where user_id = new.user_id) >= 50 then
    raise exception '監視銘柄は50件までです';
  end if;
  return new;
end;
$$;

create trigger watchlist_limit_check
  before insert on watchlists
  for each row execute function public.check_watchlist_limit();

-- シグナル検知履歴(銘柄名・シグナル定義を結合済み)
create view v_signal_events
with (security_invoker = on) as
select e.id, e.code, s.name as stock_name, e.signal_type,
       t.name as signal_name, t.description, t.category, t.origin,
       t.is_premium, e.date, e.detail,
       e.return_1d_pct, e.return_1d_yen, e.return_2d_pct, e.return_2d_yen,
       e.return_3d_pct, e.return_3d_yen
from signal_events e
join stocks s on s.code = e.code
join signal_types t on t.id = e.signal_type;

-- 銘柄一覧(最新終値付き)
create view v_stocks_with_price
with (security_invoker = on) as
select s.code, s.name, s.market, p.close, p.date as price_date
from stocks s
left join lateral (
  select close, date from daily_prices dp
  where dp.code = s.code order by dp.date desc limit 1
) p on true;

-- シグナル統計(シグナル名結合済み)
create view v_signal_stats
with (security_invoker = on) as
select st.*, t.name as signal_name, t.category
from signal_stats st join signal_types t on t.id = st.signal_type;

-- 日付別検知数(ダッシュボード用)
create view v_signal_daily_counts
with (security_invoker = on) as
select date, count(*) as n from signal_events group by date;
