
-- Create a system seed user for demo content
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'seed@tend.app',
  crypt('seed-password-not-for-login', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Tend Team"}'
);
