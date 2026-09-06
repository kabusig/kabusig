-- 登録時の1週間お試し(1人1回) + 振込識別コード
-- お試し(即時1週間有効)を消費済みか。2回目以降は付与しない。
alter table profiles add column if not exists trial_used boolean not null default false;

-- 振込人名義に付けてもらう識別コード(入金照合用)
alter table membership_orders add column if not exists pay_code text;
