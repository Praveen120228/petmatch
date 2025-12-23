-- Create a stored procedure to handle date acceptance safely with admin privileges
-- This bypasses RLS to allow updating both pets (Requester and Target) by the Target owner

create or replace function accept_dating_request(request_id bigint)
returns json
language plpgsql
security definer -- Run as database owner
as $$
declare
  req record;
  requester_pet_id bigint;
  target_pet_id bigint;
  requester_partner bigint;
  target_partner bigint;
begin
  -- 1. Get the request
  select * into req from dating_requests where id = request_id;
  
  if not found then
    return json_build_object('success', false, 'error', 'Request not found');
  end if;

  if req.status != 'pending' then
    return json_build_object('success', false, 'error', 'Request is not pending');
  end if;

  requester_pet_id := req.requester_pet_id;
  target_pet_id := req.target_pet_id;

  -- 2. Verify availability
  select partner_pet_id into requester_partner from pets where id = requester_pet_id;
  select partner_pet_id into target_partner from pets where id = target_pet_id;

  if requester_partner is not null or target_partner is not null then
     -- Optional: Auto-reject if unavailable?
     -- update dating_requests set status = 'rejected' where id = request_id;
     return json_build_object('success', false, 'error', 'One of the pets is already in a relationship');
  end if;

  -- 3. Update Request Status
  update dating_requests 
  set status = 'accepted' 
  where id = request_id;

  -- 4. Set Partners (Bi-directional)
  update pets set partner_pet_id = target_pet_id where id = requester_pet_id;
  update pets set partner_pet_id = requester_pet_id where id = target_pet_id;

  -- 5. Reject other pending requests involving these pets (Optional cleanup)
  update dating_requests 
  set status = 'rejected' 
  where status = 'pending' 
  and (
    (requester_pet_id = requester_pet_id or target_pet_id = requester_pet_id) -- Requests involving requester
    or 
    (requester_pet_id = target_pet_id or target_pet_id = target_pet_id) -- Requests involving target
  )
  and id != request_id;

  return json_build_object('success', true);
end;
$$;
