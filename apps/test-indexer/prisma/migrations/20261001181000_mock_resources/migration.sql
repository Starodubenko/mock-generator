-- CreateTable
CREATE TABLE IF NOT EXISTS "mock_resources" (
    "path" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "mock_resources_pkey" PRIMARY KEY ("path")
);
