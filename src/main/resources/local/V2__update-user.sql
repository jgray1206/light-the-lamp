SET SCHEMA dbo;
ALTER TABLE "user" ADD COLUMN display_name VARCHAR(50);
ALTER TABLE "user" ADD COLUMN profile_pic bytea;