-- Create index counters table for atomic sequence generation (per year)
create table if not exists index_counters (
  year integer not null primary key,
  last_sequence integer not null default 0
);

-- Function to atomically insert applicant and generate index number
create or replace function insert_applicant(
  p_fullname text,
  p_gender boolean,
  p_stream text,
  p_nic text,
  p_phone text,
  p_email text,
  p_school text,
  p_year integer
)
returns text
language plpgsql
as $$
declare
  next_seq integer;
  stream_letter char(1);
  yy text;
  index_no text;
begin
  -- Get stream letter (first character, uppercase)
  stream_letter := upper(substring(p_stream from 1 for 1));

  -- Get last 2 digits of year
  yy := substring(p_year::text from 3 for 2);

  -- Atomically get next sequence number for the year
  insert into index_counters (year, last_sequence)
  values (p_year, 1)
  on conflict (year)
  do update set last_sequence = index_counters.last_sequence + 1
  returning last_sequence into next_seq;

  -- Format index number: YY + 4-digit sequence + stream letter
  index_no := yy || lpad(next_seq::text, 4, '0') || stream_letter;

  -- Insert the applicant record
  insert into applicants (
    index_no, fullname, gender, stream, nic, phone, email, school, year
  ) values (
    index_no, p_fullname, p_gender, p_stream, p_nic, p_phone, p_email, p_school, p_year
  );

  return index_no;
end;
$$;

-- Function for bulk applicant creation (admin use)
create or replace function bulk_insert_applicants(
  p_applicants jsonb,  -- Array of applicant objects
  p_year integer
)
returns jsonb  -- Returns array of generated index numbers
language plpgsql
as $$
declare
  applicant_record jsonb;
  generated_indices jsonb := '[]'::jsonb;
  index_no text;
  next_seq integer;
  yy text;
  stream_letter char(1);
begin
  -- Get last 2 digits of year
  yy := substring(p_year::text from 3 for 2);

  -- Get the starting sequence number atomically
  insert into index_counters (year, last_sequence)
  values (p_year, 0)
  on conflict (year)
  do update set last_sequence = index_counters.last_sequence
  returning last_sequence into next_seq;

  -- Process each applicant in the array
  for applicant_record in select * from jsonb_array_elements(p_applicants)
  loop
    -- Increment sequence
    next_seq := next_seq + 1;

    -- Get stream letter
    stream_letter := upper(substring(applicant_record->>'stream' from 1 for 1));

    -- Format index number
    index_no := yy || lpad(next_seq::text, 4, '0') || stream_letter;

    -- Insert the applicant record
    insert into applicants (
      index_no, fullname, gender, stream, nic, phone, email, school, year
    ) values (
      index_no,
      applicant_record->>'fullname',
      (applicant_record->>'gender')::boolean,
      applicant_record->>'stream',
      applicant_record->>'nic',
      applicant_record->>'phone',
      applicant_record->>'email',
      applicant_record->>'school',
      p_year
    );

    -- Add to result array
    generated_indices := generated_indices || jsonb_build_array(index_no);
  end loop;

  -- Update the counter with the final sequence
  update index_counters set last_sequence = next_seq where year = p_year;

  return generated_indices;
end;
$$;