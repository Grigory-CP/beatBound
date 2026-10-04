// Quick sanity check that the backend can reach Supabase and the schema/seed
// are in place. Run from packages/backend with: npm run db:check
import { supabase } from "../db/supabase.js";

const { data: challenges, error } = await supabase
  .from("challenges")
  .select(
    "level_number, type, title, pitch_challenges(target_notes), rhythm_challenges(tempo_bpm)"
  )
  .order("level_number");

if (error) {
  console.error("Could not read challenges:", error.message);
  process.exit(1);
}

const { count: enemyCount, error: enemyError } = await supabase
  .from("enemies")
  .select("*", { count: "exact", head: true });

if (enemyError) {
  console.error("Could not read enemies:", enemyError.message);
  process.exit(1);
}

console.log("Connected to Supabase.\n");
console.table(
  challenges.map((c) => ({
    level: c.level_number,
    type: c.type,
    title: c.title,
    details: c.pitch_challenges
      ? `notes: ${c.pitch_challenges.target_notes.join(", ")}`
      : `tempo: ${c.rhythm_challenges?.tempo_bpm} bpm`
  }))
);
console.log(`Enemies: ${enemyCount}`);

if (challenges.length === 0) {
  console.warn(
    "\nNo challenges found. Did you run `npx supabase db push --include-seed`?"
  );
}
