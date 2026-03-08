CREATE POLICY "Admins can update members"
ON public.group_members FOR UPDATE
USING (is_group_admin(auth.uid(), group_id));