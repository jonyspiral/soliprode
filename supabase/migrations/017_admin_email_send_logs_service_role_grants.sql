-- Allow server-side Brevo admin flow to read/write internal send logs.
-- Scope: admin recovery email logging only.

grant usage on schema public to service_role;

grant select, insert on table public.admin_email_send_logs to service_role;
