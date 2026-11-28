-- reorder_socials: PostgREST runs with pg-safeupdate, which rejects an UPDATE without a WHERE clause. Same behaviour,
-- same signature, same security; the update now has a WHERE (every row, written so safeupdate accepts it).
create or replace function public.reorder_socials(p_order text[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_any_cms() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.social_links s
  set sort = coalesce((select o.ord::int from unnest(p_order) with ordinality o (n, ord) where o.n = s.network), 1000 + s.sort)
  where s.network is not null;
end $$;

revoke execute on function public.reorder_socials(text[]) from public, anon, authenticated;
grant execute on function public.reorder_socials(text[]) to authenticated, service_role;
