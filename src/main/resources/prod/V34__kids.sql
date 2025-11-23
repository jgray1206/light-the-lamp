CREATE TABLE "kid" (id SERIAL PRIMARY KEY, display_name VARCHAR(50) NOT NULL,  profile_pic bytea, parent_id BIGINT NOT NULL);
ALTER TABLE "pick" ADD COLUMN kid_id BIGINT;
