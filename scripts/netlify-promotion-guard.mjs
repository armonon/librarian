// Netlify ignore exit 0 skips; exit 1 builds.
const allowed = process.env.CONTEXT === 'deploy-preview' || process.env.LIBRARIAN_PRODUCTION_BUILDS === 'on';
console.log(allowed ? 'Building preview or qualified release.' : 'Preserving live functions until deployment is qualified.');
process.exit(allowed ? 1 : 0);
