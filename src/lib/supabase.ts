
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqssfyrlelwizcjurjal.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xc3NmeXJsZWx3aXpjanVyamFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODcyNzYsImV4cCI6MjA1Njg2MzI3Nn0.SUnXB-eQCL6oHZ7yLp7bWdYx9Hhg-a8r3tSbrPi56Z0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
