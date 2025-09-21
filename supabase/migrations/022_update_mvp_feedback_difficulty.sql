-- Ajustar validação da coluna difficulty para aceitar valores de 1 a 10
ALTER TABLE mvp_feedback DROP CONSTRAINT IF EXISTS mvp_feedback_difficulty_check;
ALTER TABLE mvp_feedback
  ADD CONSTRAINT mvp_feedback_difficulty_check
  CHECK (difficulty >= 1 AND difficulty <= 10);
