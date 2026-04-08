-- Allow admins to delete event registrations
CREATE POLICY "Admins can delete registrations"
ON public.event_registrations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
