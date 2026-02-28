-- Mark test user phone as verified (data fix for #519)
UPDATE "User"
SET "phoneVerified" = true
WHERE email = 'test@example.com'
  AND "phoneNumber" = '+64272880688';
