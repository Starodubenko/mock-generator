CREATE TABLE IF NOT EXISTS "mock_groups" (
    "name" TEXT NOT NULL,
    CONSTRAINT "mock_groups_pkey" PRIMARY KEY ("name")
);

ALTER TABLE "mock_resources" ADD COLUMN IF NOT EXISTS "method" TEXT NOT NULL DEFAULT 'GET';
ALTER TABLE "mock_resources" ADD COLUMN IF NOT EXISTS "group_name" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "mock_resources" ADD COLUMN IF NOT EXISTS "summary" TEXT NOT NULL DEFAULT '';

ALTER TABLE "mock_resources" ALTER COLUMN "job_id" SET DEFAULT '';
ALTER TABLE "mock_resources" ALTER COLUMN "body" DROP NOT NULL;

ALTER TABLE "mock_resources" DROP CONSTRAINT IF EXISTS "mock_resources_pkey";
ALTER TABLE "mock_resources" ADD CONSTRAINT "mock_resources_pkey" PRIMARY KEY ("method", "path");
