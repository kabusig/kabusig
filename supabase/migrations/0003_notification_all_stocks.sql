-- シグナルごとの通知範囲: 監視銘柄のみ(既定) or 全銘柄
-- all_stocks=true のシグナルは、監視銘柄に含まれない銘柄で検知されても通知する。
alter table notification_settings
  add column if not exists all_stocks boolean not null default false;
