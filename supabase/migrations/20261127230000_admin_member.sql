-- Member changes made by the admin-users function, audited under the acting admin (audit_row reads app.actor_id).
-- p_deactivated_at is written as given, so null reactivates; p_invited_by is only written when set.
create function public.admin_set_member(p_user uuid, p_deactivated_at timestamptz, p_invited_by uuid, p_actor uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.actor_id', coalesce(p_actor::text, ''), true);
  update public.members set deactivated_at = p_deactivated_at, invited_by = coalesce(p_invited_by, invited_by) where user_id = p_user;
end $$;
revoke execute on function public.admin_set_member(uuid, timestamptz, uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_member(uuid, timestamptz, uuid, uuid) to service_role;
