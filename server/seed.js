import { db, initDatabase } from './db.js';
import { initialFindings, initialRemediations } from './seedData.js';

export function seedDatabase(force = false) {
  initDatabase();

  const count = db.prepare('SELECT COUNT(*) as count FROM findings').get().count;

  if (count > 0 && !force) {
    console.log(`[Seed] Database already contains ${count} findings. Skipping seed.`);
    return;
  }

  if (force) {
    console.log('[Seed] Forcing database reset...');
    db.prepare('DELETE FROM retests').run();
    db.prepare('DELETE FROM evidence').run();
    db.prepare('DELETE FROM assessments').run();
    db.prepare('DELETE FROM remediations').run();
    db.prepare('DELETE FROM findings').run();
  }

  const insertFinding = db.prepare(`
    INSERT INTO findings (
      id, title, slug, category, owasp_edition, owasp_id, severity,
      cvss_score, cvss_vector, status, affected_component, target_endpoint,
      target_method, hypothesis, prerequisites, reproduction_steps,
      expected_behavior, observed_behavior, impact, remediation_summary,
      vulnerable_code_example, secure_code_example, references_list, is_seed_template
    ) VALUES (
      @id, @title, @slug, @category, @owasp_edition, @owasp_id, @severity,
      @cvss_score, @cvss_vector, @status, @affected_component, @target_endpoint,
      @target_method, @hypothesis, @prerequisites, @reproduction_steps,
      @expected_behavior, @observed_behavior, @impact, @remediation_summary,
      @vulnerable_code_example, @secure_code_example, @references_list, @is_seed_template
    )
  `);

  const insertRemediation = db.prepare(`
    INSERT OR REPLACE INTO remediations (
      id, finding_id, root_cause, recommended_fix, implementation_status,
      secure_pattern, vulnerable_pattern, verification_notes, remaining_limitations
    ) VALUES (
      @id, @finding_id, @root_cause, @recommended_fix, @implementation_status,
      @secure_pattern, @vulnerable_pattern, @verification_notes, @remaining_limitations
    )
  `);

  const insertManyFindings = db.transaction((findings) => {
    for (const f of findings) insertFinding.run(f);
  });

  const insertManyRemediations = db.transaction((remediations) => {
    for (const r of remediations) insertRemediation.run(r);
  });

  insertManyFindings(initialFindings);
  insertManyRemediations(initialRemediations);

  console.log(`[Seed] Successfully seeded ${initialFindings.length} findings and ${initialRemediations.length} remediation records.`);
}

// If executed directly from CLI:
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase(process.argv.includes('--force'));
  process.exit(0);
}
