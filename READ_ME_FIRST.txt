WILDSPEED MOTORSOS - FAST DIRECT SUPABASE UPDATE

Do these steps in order:

1. In Supabase, open SQL Editor, then New query.
2. Open the file named supabase-direct-storage-migration.sql from this folder.
3. Copy all of it into Supabase and click Run.
4. You should see: Success. No rows returned.
5. Keep your current .env file. Do not delete it.
6. Copy the project files over your existing Codespaces project.
7. In the Codespaces terminal run:
   npm install
   npm run build
8. If the build succeeds, run:
   git add .
   git commit -m "Use fast direct Supabase saving"
   git push origin main
9. Wait for GitHub Actions to turn green.
10. Test one car, one expense, and one capital deposit. Refresh after each.

The old app_state table is not deleted. It remains as a backup during migration.
