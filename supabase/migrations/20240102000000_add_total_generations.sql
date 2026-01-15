-- Add total_generations column to track lifetime generation count
alter table public.profiles
add column total_generations int default 0;

-- Update existing profiles to set total_generations based on their generations
update public.profiles p
set total_generations = (
  select count(*) from public.generations g
  where g.user_id = p.id and g.status = 'success'
);
