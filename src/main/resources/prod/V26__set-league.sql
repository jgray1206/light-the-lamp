UPDATE "game" SET league = 'NHL';
ALTER TABLE "team" ADD COLUMN league VARCHAR(8);
UPDATE "team" SET league = 'NHL';