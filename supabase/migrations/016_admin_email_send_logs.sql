-- Admin manual recovery email send logs
-- Scope: delivery tracing for controlled admin batches.
-- No communities, checkout, webhook, or payment flow changes.

create table if not exists public.admin_email_send_logs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  admin_profile_id uuid not null references public.profiles (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  participation_id uuid references public.participations (id) on delete set null,
  payment_attempt_id uuid references public.payment_attempts (id) on delete set null,
  provider text not null,
  template_key text not null,
  recipient_email text not null,
  sender_email text,
  status text not null,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb,
  constraint admin_email_send_logs_provider_check check (provider in ('brevo')),
  constraint admin_email_send_logs_template_key_check check (
    template_key in ('prizes_worldcup', 'payment_issue', 'solidarity')
  ),
  constraint admin_email_send_logs_status_check check (
    status in ('sent', 'failed', 'skipped_duplicate', 'skipped_missing_email', 'skipped_ineligible')
  )
);

create index if not exists admin_email_send_logs_profile_template_idx
  on public.admin_email_send_logs (profile_id, template_key, created_at desc);

create index if not exists admin_email_send_logs_batch_idx
  on public.admin_email_send_logs (batch_id, created_at asc);

create index if not exists admin_email_send_logs_participation_idx
  on public.admin_email_send_logs (participation_id, created_at desc);

alter table public.admin_email_send_logs enable row level security;
