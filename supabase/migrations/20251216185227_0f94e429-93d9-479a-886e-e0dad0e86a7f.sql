-- Allow authenticated users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert their own role during signup (for first user bootstrap)
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);