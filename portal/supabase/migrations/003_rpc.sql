-- ============================================================
-- Migration 003: RPCs (API_CONTRACTS.md) — signed downloads, summary, native booking.
-- All security definer + membership re-checked inside. Client-side never trusted.
-- ============================================================

-- ---------- dashboard summary ----------
create or replace function portal_summary() returns jsonb
  language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'projects', (select count(*) from v_client_projects),
    'unread',   (select count(*) from notifications where user_id = auth.uid() and read_at is null),
    'invoices_due', (select count(*) from invoices i where status in ('sent','overdue')
                      and is_member(i.client_id)),
    'next_meeting', (select min(starts_at) from bookings b where b.status='confirmed'
                      and starts_at >= now() and is_member(b.client_id))
  ) $$;

-- ---------- signed downloads ----------
create or replace function sign_download(asset_id uuid) returns jsonb
  language plpgsql security definer set search_path = public as $$
declare a record; signed text;
begin
  select * into a from assets where id = asset_id;
  if a is null then raise exception 'not_available' using errcode='P0002'; end if;
  if not is_member(project_client(a.portal_project_id)) then raise exception 'not_a_member' using errcode='P0001'; end if;
  if a.status = 'draft' then raise exception 'not_available' using errcode='P0002'; end if;
  select token into signed from storage.create_signed_url('assets', a.file_path, 300); -- 5 min
  perform log_audit('download', 'asset', asset_id, '{}');
  return jsonb_build_object('url', signed, 'expires_at', now() + interval '5 minutes');
end $$;

create or replace function sign_invoice(invoice_id uuid) returns jsonb
  language plpgsql security definer set search_path = public as $$
declare i record; signed text;
begin
  select * into i from invoices where id = invoice_id;
  if i is null or i.pdf_path is null then raise exception 'not_available' using errcode='P0002'; end if;
  if not is_member(i.client_id) then raise exception 'not_a_member' using errcode='P0001'; end if;
  select token into signed from storage.create_signed_url('invoices', i.pdf_path, 300);
  perform log_audit('download', 'invoice', invoice_id, '{}');
  return jsonb_build_object('url', signed, 'expires_at', now() + interval '5 minutes');
end $$;

-- ---------- native booking: compute open slots ----------
-- lead time 24h, horizon 6 weeks; rules − overrides − confirmed bookings.
create or replace function list_slots(p_from date, p_to date) returns table(starts_at timestamptz, ends_at timestamptz)
  language plpgsql stable security definer set search_path = public as $$
declare r record; d date; slot_start timestamptz; slot_end timestamptz; tz text;
begin
  if auth.uid() is null then raise exception 'not_a_member' using errcode='P0001'; end if;
  d := greatest(p_from, current_date);
  while d <= least(p_to, current_date + 42) loop
    for r in select * from availability_rules where active and weekday = ((extract(isodow from d)::int + 6) % 7) loop
      -- skip closed override days
      if exists (select 1 from availability_overrides o where o.on_date = d and o.kind='closed') then continue; end if;
      tz := r.timezone;
      slot_start := (d::text || ' 00:00')::timestamp at time zone tz + (r.start_min || ' minutes')::interval;
      while slot_start + (r.slot_minutes || ' minutes')::interval
            <= (d::text || ' 00:00')::timestamp at time zone tz + (r.end_min || ' minutes')::interval loop
        slot_end := slot_start + (r.slot_minutes || ' minutes')::interval;
        if slot_start > now() + interval '24 hours'
           and not exists (select 1 from bookings b where b.status='confirmed'
             and tstzrange(b.starts_at, b.ends_at) && tstzrange(slot_start, slot_end)) then
          starts_at := slot_start; ends_at := slot_end; return next;
        end if;
        slot_start := slot_end;
      end loop;
    end loop;
    d := d + 1;
  end loop;
end $$;

-- ---------- native booking: atomic book ----------
create or replace function book_slot(p_starts_at timestamptz, p_title text default null) returns jsonb
  language plpgsql security definer set search_path = public as $$
declare cid uuid; slot_len int; s_end timestamptz; new_id uuid; recent int;
begin
  select client_id into cid from portal_members where user_id = auth.uid() and status='active' limit 1;
  if cid is null then raise exception 'not_a_member' using errcode='P0001'; end if;
  -- rate limit: max 5 bookings per member per day
  select count(*) into recent from bookings where booked_by = auth.uid() and created_at > now() - interval '1 day';
  if recent >= 5 then raise exception 'rate_limited' using errcode='P0005'; end if;
  -- validate the slot exists in current availability
  if not exists (select 1 from list_slots(current_date, current_date + 42) s where s.starts_at = p_starts_at) then
    raise exception 'outside_availability' using errcode='P0004';
  end if;
  select slot_minutes into slot_len from availability_rules where active order by slot_minutes limit 1;
  s_end := p_starts_at + (coalesce(slot_len,30) || ' minutes')::interval;
  begin
    insert into bookings(client_id, booked_by, title, starts_at, ends_at)
      values (cid, auth.uid(), coalesce(p_title, 'Project check-in'), p_starts_at, s_end)
      returning id into new_id;
  exception when exclusion_violation then
    raise exception 'slot_taken' using errcode='P0003';   -- gist constraint = the guard
  end;
  perform log_audit('book', 'booking', new_id, jsonb_build_object('starts_at', p_starts_at));
  return jsonb_build_object('booking_id', new_id, 'starts_at', p_starts_at, 'ends_at', s_end);
end $$;

create or replace function cancel_booking(p_id uuid) returns jsonb
  language plpgsql security definer set search_path = public as $$
declare b record;
begin
  select * into b from bookings where id = p_id;
  if b is null or b.booked_by <> auth.uid() then raise exception 'not_available' using errcode='P0002'; end if;
  if b.starts_at < now() + interval '24 hours' then raise exception 'too_late' using errcode='P0006'; end if;
  update bookings set status='canceled' where id = p_id;
  perform log_audit('cancel_booking', 'booking', p_id, '{}');
  return jsonb_build_object('ok', true);
end $$;
