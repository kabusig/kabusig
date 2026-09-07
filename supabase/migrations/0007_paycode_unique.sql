-- 確認待ち(pending)の申込どうしで pay_code が重複しないようにする。
-- confirm_membership は pending をコードで照合するため、pending 内で一意なら誤照合を防げる。
-- (confirmed 済みの過去コードとは重複してよい=部分インデックス)
create unique index if not exists membership_orders_paycode_pending_uniq
  on membership_orders (pay_code)
  where status = 'pending';
