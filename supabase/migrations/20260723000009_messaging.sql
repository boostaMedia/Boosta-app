-- ============================================================================
-- Migration: messaging
-- Conversations between customers and providers, and their messages.
-- ============================================================================

create table public.conversations (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.users (id) on delete cascade,
  provider_id       uuid not null references public.providers (id) on delete cascade,
  order_id          uuid references public.orders (id) on delete set null,
  quote_request_id  uuid references public.quote_requests (id) on delete set null,
  subject           text,
  status            public.conversation_status not null default 'open',
  last_message_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index conversations_customer_id_idx on public.conversations (customer_id);
create index conversations_provider_id_idx on public.conversations (provider_id);
create index conversations_last_message_idx on public.conversations (last_message_at desc nulls last);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.users (id) on delete cascade,
  body             text,
  attachments      jsonb not null default '[]'::jsonb,
  is_read          boolean not null default false,
  read_at          timestamptz,
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint messages_content_ck check (
    (body is not null and length(btrim(body)) > 0)
    or jsonb_array_length(attachments) > 0
  )
);
create index messages_conversation_id_idx on public.messages (conversation_id, created_at);
create index messages_sender_id_idx on public.messages (sender_id);

create trigger set_conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

-- Bump conversation.last_message_at when a message is inserted.
create or replace function public.bump_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger bump_conversation_on_message
  after insert on public.messages
  for each row execute function public.bump_conversation_last_message();
