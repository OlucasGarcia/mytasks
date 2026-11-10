do $$
begin
    if to_regclass('public.tasks') is not null then
        raise exception 'public.tasks already exists; inspect its columns, grants, and RLS policies before applying this migration';
    end if;
end
$$;

create table public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    title text not null check (char_length(btrim(title)) between 1 and 100),
    description text not null default '' check (char_length(description) <= 2000),
    category text not null default '' check (char_length(category) <= 60),
    priority text not null default 'medium'
        check (priority in ('low', 'medium', 'high')),
    status text not null default 'pending'
        check (status in ('pending', 'in_progress', 'completed')),
    date date,
    time time,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index tasks_user_created_at_idx
    on public.tasks (user_id, created_at desc);

alter table public.tasks enable row level security;

grant select on public.tasks to anon;
grant select, insert, update, delete on public.tasks to authenticated;

create policy "Users can view their own tasks"
    on public.tasks for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "Users can create their own tasks"
    on public.tasks for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks"
    on public.tasks for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tasks"
    on public.tasks for delete
    to authenticated
    using ((select auth.uid()) = user_id);

create function public.set_task_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
        if new.status = 'completed' then
            new.completed_at := coalesce(new.completed_at, pg_catalog.now());
        else
            new.completed_at := null;
        end if;
    else
        new.updated_at := pg_catalog.now();

        if new.status <> 'completed' then
            new.completed_at := null;
        elsif old.status <> 'completed' then
            new.completed_at := pg_catalog.now();
        end if;
    end if;

    return new;
end;
$$;

create trigger set_task_timestamps
    before insert or update on public.tasks
    for each row
    execute function public.set_task_timestamps();
