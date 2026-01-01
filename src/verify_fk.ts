
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFK() {
    console.log("Verifying Post Foreign Keys...");

    // 1. Fetch any post to get a valid user_id
    const { data: posts, error: postError } = await supabase.from('posts').select('*').limit(1);

    if (postError) {
        console.error("Error fetching any post:", postError);
        return;
    }

    if (!posts || posts.length === 0) {
        console.log("No posts found to test with.");
    } else {
        console.log("Found post:", posts[0].id);
    }

    // 2. Try Specific Alias
    console.log("Testing 'profiles!posts_user_id_fkey'...");
    const { error: e1 } = await supabase
        .from('posts')
        .select(`*, profiles!posts_user_id_fkey (name)`)
        .limit(1);

    if (e1) {
        console.error("❌ Alias 'posts_user_id_fkey' FAILED:", e1.message);
    } else {
        console.log("✅ Alias 'posts_user_id_fkey' SUCCESS");
    }

    // 3. Try Generic Name
    console.log("Testing 'profiles' (generic)...");
    const { error: e2 } = await supabase
        .from('posts')
        .select(`*, profiles (name)`)
        .limit(1);

    if (e2) {
        console.error("❌ Generic 'profiles' FAILED:", e2.message);
    } else {
        console.log("✅ Generic 'profiles' SUCCESS");
    }

    // 4. Try Implicit
    console.log("Testing 'profiles!user_id'...");
    const { error: e3 } = await supabase
        .from('posts')
        .select(`*, profiles!user_id (name)`)
        .limit(1);

    if (e3) {
        console.error("❌ 'profiles!user_id' FAILED:", e3.message);
    } else {
        console.log("✅ 'profiles!user_id' SUCCESS");
    }

}

verifyFK();
