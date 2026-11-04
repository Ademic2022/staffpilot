// Prints the user guide as JSON, for scripts/build_help_pdf.py. Run with: npx vite-node scripts/help-export.ts
import { AUDIENCE_LABEL, SECTIONS } from "../src/help/index";

process.stdout.write(JSON.stringify({ audiences: AUDIENCE_LABEL, sections: SECTIONS }));
