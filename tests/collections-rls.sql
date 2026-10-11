insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
 ('11111111-1111-4111-8111-111111111111','owner@example.test',now(),false),
 ('22222222-2222-4222-8222-222222222222','editor@example.test',now(),false),
 ('33333333-3333-4333-8333-333333333333','stranger@example.test',now(),false),
 ('44444444-4444-4444-8444-444444444444','unverified@example.test',null,false);
set role authenticated;
set app.user_id='11111111-1111-4111-8111-111111111111';
insert into public.librarian_collections(id,owner_id,title,curator) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',auth.uid(),'Owner library','Owner');
insert into storage.objects(bucket_id,name) values('librarian-pdfs','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.pdf');
insert into public.librarian_books(id,collection_id,title,storage_path,size,rights_confirmed) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','One book','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.pdf',100,true);
update public.librarian_collections set published=true,visibility='public';
set role anon;
set app.user_id='';
do $$ begin
 if (select count(*) from public.librarian_collections)<>1 or (select count(*) from storage.objects)<>1 then raise exception 'Public reading failed'; end if;
end $$;
set role authenticated;
set app.user_id='11111111-1111-4111-8111-111111111111';
update public.librarian_collections set published=false,visibility='private';
set role anon;
set app.user_id='';
do $$ begin
 if exists(select 1 from public.librarian_collections) or exists(select 1 from public.librarian_books) or exists(select 1 from storage.objects) then raise exception 'Private data leaked to guests'; end if;
end $$;
set role authenticated;
set app.user_id='33333333-3333-4333-8333-333333333333';
do $$ begin
 if exists(select 1 from public.librarian_collections) then raise exception 'Private data leaked to strangers'; end if;
 begin
  insert into storage.objects(bucket_id,name) values('librarian-pdfs','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cccccccc-cccc-4ccc-8ccc-cccccccccccc.pdf');
  raise exception 'Stranger could upload';
 exception when insufficient_privilege then null; end;
 update public.librarian_collections set title='Hacked';
 if found then raise exception 'Stranger could modify library'; end if;
end $$;
set app.user_id='44444444-4444-4444-8444-444444444444';
do $$ begin
 begin
  insert into public.librarian_collections(owner_id,title,curator) values(auth.uid(),'Unverified','Nobody');
  raise exception 'Unverified user could create library';
 exception when insufficient_privilege then null; end;
end $$;
set app.user_id='11111111-1111-4111-8111-111111111111';
insert into public.librarian_members(collection_id,email) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','editor@example.test');
set app.user_id='22222222-2222-4222-8222-222222222222';
do $$ begin
 if (select count(*) from public.librarian_collections)<>1 or (select count(*) from storage.objects)<>1 then raise exception 'Editor cannot read private library'; end if;
 update public.librarian_books set title='Editor updated';
 if not found then raise exception 'Editor cannot edit books'; end if;
 update public.librarian_collections set visibility='public',published=true;
 if found then raise exception 'Editor could change sharing'; end if;
end $$;
set app.user_id='11111111-1111-4111-8111-111111111111';
delete from public.librarian_members;
set app.user_id='22222222-2222-4222-8222-222222222222';
do $$ begin
 if exists(select 1 from public.librarian_collections) or exists(select 1 from storage.objects) then raise exception 'Revoked editor retained access'; end if;
end $$;
set app.user_id='11111111-1111-4111-8111-111111111111';
do $$ begin
 begin
  update public.librarian_collections set owner_id='33333333-3333-4333-8333-333333333333';
  raise exception 'Ownership transfer accepted';
 exception when raise_exception then if sqlerrm<>'Library identity is immutable' then raise; end if; end;
end $$;
update public.librarian_collections set published=true,visibility='unlisted';
set role anon;
set app.user_id='';
do $$ begin
 if (select count(*) from public.librarian_collections)<>1 then raise exception 'Unlisted reading failed'; end if;
 if exists(select 1 from public.librarian_collections where visibility='public') then raise exception 'Unlisted appeared in public feed'; end if;
end $$;
set role authenticated;
set app.user_id='33333333-3333-4333-8333-333333333333';
insert into public.librarian_favorites(user_id,collection_id) values(auth.uid(),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
set app.user_id='11111111-1111-4111-8111-111111111111';
do $$ begin
 if exists(select 1 from public.librarian_favorites) then raise exception 'Favorites leaked across accounts'; end if;
end $$;
delete from public.librarian_books;
do $$ begin
 if exists(select 1 from public.librarian_collections where published) then raise exception 'Empty library stayed published'; end if;
end $$;
reset role;
select 'Collections RLS checks passed' as result;
