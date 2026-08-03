-- CreateEnum
CREATE TYPE "VotedBy" AS ENUM ('jury', 'fan');

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "nominee" TEXT NOT NULL,
    "company" TEXT,
    "is_winner" BOOLEAN NOT NULL,
    "voted_by" "VotedBy" NOT NULL,

    CONSTRAINT "nominations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "correct_nomination_id" INTEGER NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "quiz_question_id" INTEGER NOT NULL,
    "chosen_nomination_id" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_canonical_name_key" ON "categories"("canonical_name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "nominations_year_category_id_idx" ON "nominations"("year", "category_id");

-- CreateIndex
CREATE INDEX "nominations_category_id_idx" ON "nominations"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_year_category_id_key" ON "quiz_questions"("year", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_user_id_quiz_question_id_key" ON "quiz_attempts"("user_id", "quiz_question_id");

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_correct_nomination_id_fkey" FOREIGN KEY ("correct_nomination_id") REFERENCES "nominations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_question_id_fkey" FOREIGN KEY ("quiz_question_id") REFERENCES "quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_chosen_nomination_id_fkey" FOREIGN KEY ("chosen_nomination_id") REFERENCES "nominations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
