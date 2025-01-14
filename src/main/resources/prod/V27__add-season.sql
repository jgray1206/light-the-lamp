ALTER TABLE "game" ADD COLUMN season VARCHAR(8);
UPDATE "game" SET season = SUBSTR(cast(id as VARCHAR), 1, 6);