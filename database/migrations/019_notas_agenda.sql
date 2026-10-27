-- 019_agenda_notes.sql
--
-- A agenda até aqui só mostrava o que vinha de pedidos aceitos
-- (orders.scheduled_at) — o trabalhador não tinha como anotar um
-- compromisso próprio (uma tarefa pessoal, um lembrete) num dia. Isso
-- é dele, então fica numa tabela separada de orders — sem cliente,
-- sem preço, só data + título + observação opcional.

CREATE TABLE IF NOT EXISTS agenda_notes (
  id          SERIAL PRIMARY KEY,
  worker_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_date   DATE NOT NULL,
  title       VARCHAR(150) NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_notes_worker_date ON agenda_notes (worker_id, note_date);
