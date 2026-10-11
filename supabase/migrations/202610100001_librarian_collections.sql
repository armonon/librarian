-- Apply once in the chosen Supabase project before enabling Collections.
begin;
create table public.librarian_collections (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (length(trim(title)) between 1 and 120),
 description text not null default '' check (length(description)<=2000),
 curator text not null check (length(trim(curator)) between 1 and 80), bio text not null default '' check (length(bio)<=1000),
 topic text not null default '' check (length(topic)<=80),
 theme text not null default 'paper' check (theme in ('paper','midnight','forest')),
 layout text not null default 'shelves' check (layout in ('shelves','gallery','reading-path')),
 visibility text not null default 'private' check (visibility in ('public','unlisted','private')),
 published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.librarian_members (
 collection_id uuid not null references public.librarian_collections(id) on delete cascade,
 email text not null check (email=lower(email) and length(email)<=254 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
 primary key(collection_id,email)
);
create table public.librarian_books (
 id uuid primary key default gen_random_uuid(), collection_id uuid not null references public.librarian_collections(id) on delete cascade,
 title text not null check(length(trim(title)) between 1 and 200), author text not null default '' check(length(author)<=200),
 description text not null default '' check(length(description)<=2000), shelf text not null default 'The collection' check(length(shelf)<=100),
 color text not null default '#7a3b2e' check(color ~ '^#[0-9a-fA-F]{6}$'), position integer not null default 0 check(position between 0 and 10000),
 storage_path text not null unique, size integer not null check(size between 12 and 4194304),
 rights_confirmed boolean not null check(rights_confirmed), created_at timestamptz not null default now(),
 check(storage_path=collection_id::text || '/' || id::text || '.pdf')
);
create table public.librarian_follows (
 user_id uuid not null references auth.users(id) on delete cascade, collection_id uuid not null references public.librarian_collections(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,collection_id)
);
create table public.librarian_favorites (like public.librarian_follows including defaults including constraints including indexes);
alter table public.librarian_favorites add foreign key(user_id) references auth.users(id) on delete cascade;
alter table public.librarian_favorites add foreign key(collection_id) references public.librarian_collections(id) on delete cascade;
create table public.librarian_reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references auth.users(id) on delete cascade,
 collection_id uuid not null references public.librarian_collections(id) on delete cascade,
 reason text not null check(length(trim(reason)) between 10 and 2000), created_at timestamptz not null default now(), resolved_at timestamptz
);
create index on public.librarian_collections(updated_at desc) where published and visibility='public';
create index on public.librarian_books(collection_id,position);
create index on public.librarian_members(email);
create index on public.librarian_collections(owner_id);

create function public.librarian_verified() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and not is_anonymous and not exists(select 1 from auth.mfa_factors f where f.user_id=auth.uid() and f.status='verified'));
$$;
create function public.librarian_owner(lib uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.librarian_verified() and exists(select 1 from public.librarian_collections where id=lib and owner_id=auth.uid());
$$;
create function public.librarian_editor(lib uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.librarian_verified() and (public.librarian_owner(lib) or exists(select 1 from public.librarian_members m join auth.users u on lower(u.email)=m.email where m.collection_id=lib and u.id=auth.uid()));
$$;
create function public.librarian_reader(lib uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.librarian_collections where id=lib and published and visibility in ('public','unlisted')) or public.librarian_editor(lib);
$$;
create function public.librarian_my_collections() returns setof public.librarian_collections language sql stable security invoker set search_path='' as $$
 select * from public.librarian_collections where public.librarian_editor(id) order by updated_at desc;
$$;
create function public.librarian_collection_guard() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if TG_OP='INSERT' then
  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,0));
  if (select count(*) from public.librarian_collections where owner_id=new.owner_id)>=10 then raise exception 'Maximum ten libraries per curator'; end if;
  if new.published then raise exception 'Create a draft first'; end if;
 else
  if new.id<>old.id or new.owner_id<>old.owner_id or new.created_at<>old.created_at then raise exception 'Library identity is immutable'; end if;
  if new.published and not exists(select 1 from public.librarian_books where collection_id=new.id) then raise exception 'Add a PDF before publishing'; end if;
 end if;
 new.updated_at=now(); return new;
 end;
$$;
create trigger librarian_collection_guard before insert or update on public.librarian_collections for each row execute function public.librarian_collection_guard();
create function public.librarian_book_guard() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if TG_OP='INSERT' then
  perform pg_advisory_xact_lock(hashtextextended(new.collection_id::text,0));
  if (select count(*) from public.librarian_books where collection_id=new.collection_id)>=50 then raise exception 'Maximum fifty books per library'; end if;
  if not exists(select 1 from storage.objects where bucket_id='librarian-pdfs' and name=new.storage_path) then raise exception 'Upload PDF before adding book'; end if;
 elsif TG_OP='UPDATE' then
  if new.id<>old.id or new.collection_id<>old.collection_id or new.storage_path<>old.storage_path or new.size<>old.size or new.created_at<>old.created_at then raise exception 'Book identity is immutable'; end if;
 end if;
 return new;
 end;
$$;
create trigger librarian_book_guard before insert or update on public.librarian_books for each row execute function public.librarian_book_guard();
create function public.librarian_book_changed() returns trigger language plpgsql security definer set search_path='' as $$
 declare lib uuid;
 begin
 lib=case when TG_OP='DELETE' then old.collection_id else new.collection_id end;
 update public.librarian_collections set published=published and exists(select 1 from public.librarian_books where collection_id=lib), updated_at=now() where id=lib;
 return null;
 end;
$$;
create trigger librarian_book_changed after insert or update or delete on public.librarian_books for each row execute function public.librarian_book_changed();

alter table public.librarian_collections enable row level security;
alter table public.librarian_books enable row level security;
alter table public.librarian_members enable row level security;
alter table public.librarian_follows enable row level security;
alter table public.librarian_favorites enable row level security;
alter table public.librarian_reports enable row level security;
create policy collections_read on public.librarian_collections for select using(public.librarian_reader(id));
create policy collections_insert on public.librarian_collections for insert to authenticated with check(owner_id=auth.uid() and public.librarian_verified());
create policy collections_update on public.librarian_collections for update to authenticated using(public.librarian_owner(id)) with check(owner_id=auth.uid() and public.librarian_verified());
create policy collections_delete on public.librarian_collections for delete to authenticated using(public.librarian_owner(id));
create policy books_read on public.librarian_books for select using(public.librarian_reader(collection_id));
create policy books_insert on public.librarian_books for insert to authenticated with check(public.librarian_editor(collection_id));
create policy books_update on public.librarian_books for update to authenticated using(public.librarian_editor(collection_id)) with check(public.librarian_editor(collection_id));
create policy books_delete on public.librarian_books for delete to authenticated using(public.librarian_editor(collection_id));
create policy members_read on public.librarian_members for select to authenticated using(public.librarian_editor(collection_id));
create policy members_insert on public.librarian_members for insert to authenticated with check(public.librarian_owner(collection_id));
create policy members_delete on public.librarian_members for delete to authenticated using(public.librarian_owner(collection_id));
create policy follows_read on public.librarian_follows for select to authenticated using(user_id=auth.uid());
create policy follows_insert on public.librarian_follows for insert to authenticated with check(user_id=auth.uid() and public.librarian_verified() and public.librarian_reader(collection_id));
create policy follows_delete on public.librarian_follows for delete to authenticated using(user_id=auth.uid());
create policy favorites_read on public.librarian_favorites for select to authenticated using(user_id=auth.uid());
create policy favorites_insert on public.librarian_favorites for insert to authenticated with check(user_id=auth.uid() and public.librarian_verified() and public.librarian_reader(collection_id));
create policy favorites_delete on public.librarian_favorites for delete to authenticated using(user_id=auth.uid());
create policy reports_insert on public.librarian_reports for insert to authenticated with check(reporter_id=auth.uid() and public.librarian_verified() and public.librarian_reader(collection_id) and resolved_at is null);
create policy reports_read on public.librarian_reports for select to authenticated using(reporter_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('librarian-pdfs','librarian-pdfs',false,4194304,array['application/pdf']);
create function public.librarian_object_editor(path text) returns boolean language plpgsql stable security definer set search_path='' as $$
 begin
 if path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$' then return false; end if;
 return public.librarian_editor(split_part(path,'/',1)::uuid);
 exception when invalid_text_representation then return false;
 end;
$$;
create policy librarian_pdf_read on storage.objects for select using(bucket_id='librarian-pdfs' and (public.librarian_object_editor(name) or exists(select 1 from public.librarian_books b where b.storage_path=name and public.librarian_reader(b.collection_id))));
create policy librarian_pdf_insert on storage.objects for insert to authenticated with check(bucket_id='librarian-pdfs' and public.librarian_object_editor(name));
create policy librarian_pdf_delete on storage.objects for delete to authenticated using(bucket_id='librarian-pdfs' and public.librarian_object_editor(name));
-- No UPDATE policy: stored PDF bytes cannot be replaced in place.
grant select on public.librarian_collections,public.librarian_books to anon,authenticated;
grant insert,update,delete on public.librarian_collections,public.librarian_books to authenticated;
grant select,insert,delete on public.librarian_members,public.librarian_follows,public.librarian_favorites to authenticated;
grant select,insert on public.librarian_reports to authenticated;
revoke all on function public.librarian_verified(),public.librarian_owner(uuid),public.librarian_editor(uuid),public.librarian_reader(uuid),public.librarian_my_collections(),public.librarian_object_editor(text),public.librarian_collection_guard(),public.librarian_book_guard(),public.librarian_book_changed() from public;
grant execute on function public.librarian_verified(),public.librarian_owner(uuid),public.librarian_editor(uuid),public.librarian_reader(uuid),public.librarian_object_editor(text) to anon,authenticated;
grant execute on function public.librarian_my_collections() to authenticated;
commit;
