-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE IF NOT EXISTS "jobs" (
    "job_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "contour" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "profile_version_id" TEXT,
    "seed" TEXT,
    "requested_count" INTEGER,
    "published_count" INTEGER NOT NULL,
    "quarantine_count" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TEXT NOT NULL,
    "finished_at" TEXT,
    "checkpoint_document_number" INTEGER NOT NULL,
    "target_index" TEXT,
    "generated_at" TEXT,
    "field_constraints" TEXT,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "profile_versions" (
    "document_type" TEXT NOT NULL,
    "contour" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    "mapping_index" TEXT NOT NULL,
    "paths" TEXT NOT NULL,
    "aliases" TEXT NOT NULL,
    "corpus_value_fingerprints" TEXT NOT NULL,
    "sample_document_count" INTEGER NOT NULL,
    "activatable" BOOLEAN NOT NULL,

    CONSTRAINT "profile_versions_pkey" PRIMARY KEY ("document_type","contour","version_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "active_versions" (
    "document_type" TEXT NOT NULL,
    "contour" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,

    CONSTRAINT "active_versions_pkey" PRIMARY KEY ("document_type","contour")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "idempotency" (
    "key" TEXT NOT NULL,
    "body_hash" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,

    CONSTRAINT "idempotency_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "training_in_flight" (
    "key" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,

    CONSTRAINT "training_in_flight_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "enum_extras" (
    "document_type" TEXT NOT NULL,
    "contour" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "enum_extras_pkey" PRIMARY KEY ("document_type","contour","version_id","path","value")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "version_labels" (
    "document_type" TEXT NOT NULL,
    "contour" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "version_labels_pkey" PRIMARY KEY ("document_type","contour","version_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "activation_journal" (
    "id" BIGSERIAL NOT NULL,
    "document_type" TEXT NOT NULL,
    "contour" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "previous_version_id" TEXT,
    "activated_at" TEXT NOT NULL,

    CONSTRAINT "activation_journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "quarantine" (
    "id" BIGSERIAL NOT NULL,
    "job_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "quarantine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "synthetic_indices" (
    "name" TEXT NOT NULL,

    CONSTRAINT "synthetic_indices_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "synthetic_sources" (
    "name" TEXT NOT NULL,

    CONSTRAINT "synthetic_sources_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "published_ids" (
    "id" BIGSERIAL NOT NULL,
    "job_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "published_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "draft_documents" (
    "job_id" TEXT NOT NULL,
    "documents" TEXT NOT NULL,

    CONSTRAINT "draft_documents_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "document_types" (
    "document_type" TEXT NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("document_type")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "meta" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "meta_pkey" PRIMARY KEY ("key")
);
