-- Make billy.haen@gmail.com admin permanently
DELETE FROM public.user_roles WHERE user_id = 'ab0d93f1-342a-486d-98e4-3a31c591c607';
INSERT INTO public.user_roles (user_id, role) VALUES ('ab0d93f1-342a-486d-98e4-3a31c591c607', 'admin');