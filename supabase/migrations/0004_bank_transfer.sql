-- 銀行振込による年会費(前払い)対応
-- 会員の有効期限(この日まで有料機能が使える)
alter table profiles add column if not exists paid_until date;

-- 振込申込の記録(運営者が入金を名義で照合し、確認したら plan/paid_until を更新)
create table if not exists membership_orders (
  id bigint generated always as identity primary key,
  user_id uuid references profiles not null,
  transfer_name text,                 -- 振込名義(カナ)。入金照合用
  amount int,                         -- 申込時の年会費
  status text not null default 'pending',  -- pending / confirmed / canceled
  created_at timestamptz default now(),
  confirmed_at timestamptz
);

alter table membership_orders enable row level security;

-- 会員は自分の申込のみ参照・作成できる(確認・変更は service role のみ)
create policy "own orders select" on membership_orders
  for select using (auth.uid() = user_id);
create policy "own orders insert" on membership_orders
  for insert with check (auth.uid() = user_id);
