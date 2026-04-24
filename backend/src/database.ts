import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;
  
  const dbPath = path.join(__dirname, '..', 'data', 'dialectics.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dialogue_messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      round INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS argument_nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      parent_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('hypothesis', 'assumption', 'evidence', 'counterargument', 'refinement')),
      content TEXT NOT NULL,
      strength REAL NOT NULL DEFAULT 0.5,
      vulnerability_score REAL NOT NULL DEFAULT 0.3,
      created_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (parent_id) REFERENCES argument_nodes(id)
    );

    CREATE TABLE IF NOT EXISTS attacks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('logical_fallacy', 'evidence_gap', 'assumption_weakness', 'methodological_flaw', 'alternative_explanation')),
      description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('high', 'medium', 'low')),
      suggestion TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (node_id) REFERENCES argument_nodes(id)
    );

    CREATE TABLE IF NOT EXISTS defense_questions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      question TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
      user_answer TEXT,
      evaluation TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS cross_disciplinary_insights (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_field TEXT NOT NULL,
      target_application TEXT NOT NULL,
      paradigm TEXT NOT NULL,
      methodology TEXT NOT NULL,
      relevance REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE INDEX IF NOT EXISTS idx_dialogue_project ON dialogue_messages(project_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_project ON argument_nodes(project_id);
    CREATE INDEX IF NOT EXISTS idx_attacks_node ON attacks(node_id);
    CREATE INDEX IF NOT EXISTS idx_defense_project ON defense_questions(project_id);
  `);

  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
