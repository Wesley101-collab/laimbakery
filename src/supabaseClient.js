// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txbroolninqbndafiaxn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YnJvb2xuaW5xYm5kYWZpYXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzgyMzEyMiwiZXhwIjoyMDQ5Mzk5MTIyfQ.12sBvFqdo2wpAzIxF3wIjo794UGkIq2PUeVRdipTaCU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);