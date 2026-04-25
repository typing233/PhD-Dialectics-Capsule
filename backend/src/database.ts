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

    CREATE TABLE IF NOT EXISTS prompt_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      user_prompt_template TEXT NOT NULL,
      description TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dialectical_triads (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      thesis_content TEXT NOT NULL,
      thesis_key_points TEXT NOT NULL,
      thesis_citations TEXT,
      antithesis_content TEXT NOT NULL,
      antithesis_key_points TEXT NOT NULL,
      antithesis_citations TEXT,
      synthesis_content TEXT NOT NULL,
      synthesis_key_points TEXT NOT NULL,
      synthesis_reconciled_points TEXT NOT NULL,
      synthesis_citations TEXT,
      context TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS dialectical_nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      triad_id TEXT,
      parent_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('thesis', 'antithesis', 'synthesis', 'branch')),
      content TEXT NOT NULL,
      key_points TEXT NOT NULL,
      citations TEXT,
      position_x REAL NOT NULL DEFAULT 0,
      position_y REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (triad_id) REFERENCES dialectical_triads(id),
      FOREIGN KEY (parent_id) REFERENCES dialectical_nodes(id)
    );

    CREATE TABLE IF NOT EXISTS dialectical_edges (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      relation TEXT NOT NULL CHECK(relation IN ('supports', 'challenges', 'evolves_from', 'reconciles', 'branches')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (source_id) REFERENCES dialectical_nodes(id),
      FOREIGN KEY (target_id) REFERENCES dialectical_nodes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_dialogue_project ON dialogue_messages(project_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_project ON argument_nodes(project_id);
    CREATE INDEX IF NOT EXISTS idx_attacks_node ON attacks(node_id);
    CREATE INDEX IF NOT EXISTS idx_defense_project ON defense_questions(project_id);
    CREATE INDEX IF NOT EXISTS idx_templates_category ON prompt_templates(category);
    CREATE INDEX IF NOT EXISTS idx_triads_project ON dialectical_triads(project_id);
    CREATE INDEX IF NOT EXISTS idx_dialectical_nodes_project ON dialectical_nodes(project_id);
    CREATE INDEX IF NOT EXISTS idx_dialectical_edges_project ON dialectical_edges(project_id);
  `);

  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
