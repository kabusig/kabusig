-- 入金確認を1行で行うための関数。
-- 使い方(SQL Editor): select confirm_membership('K7X9Q');
--   → 該当会員の有効期限を1年延長し、申込を confirmed にする。
-- 継続(まだ有効なうちの更新)の場合は現在の期限から+1年、
-- 失効後は本日から+1年に設定する。
create or replace function confirm_membership(code text)
returns text
language plpgsql
security definer
as $$
declare
  uid uuid;
  new_until date;
begin
  select user_id into uid
  from membership_orders
  where pay_code = code and status = 'pending'
  order by created_at desc
  limit 1;

  if uid is null then
    return '該当なし(pending): ' || code;
  end if;

  update profiles
  set plan = 'paid',
      paid_until = (case
        when paid_until is null or paid_until < current_date then current_date
        else paid_until end) + interval '1 year'
  where id = uid
  returning paid_until into new_until;

  update membership_orders
  set status = 'confirmed', confirmed_at = now()
  where pay_code = code and status = 'pending';

  return '確認完了: ' || uid || ' / 有効期限 ' || new_until;
end;
$$;

-- 外部(anon/authenticated)から呼べないようにする(SQL Editor / service role のみ)
revoke all on function confirm_membership(text) from public;
