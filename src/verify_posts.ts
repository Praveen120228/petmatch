
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

async function verify() {
    console.log("Verifying posts...");
    // 1. List all posts to see if ANY exist
    const { data: allPosts, error: allError } = await supabase.from('posts').select('*').limit(5);
    if (allError) {
        console.error("Error fetching all posts:", allError);
    } else {
        console.log(`Found ${allPosts.length} total posts.`);
        if (allPosts.length > 0) {
            console.log("Sample post:", allPosts[0]);
        }
    }

    // 2. Check for profiles!posts_user_id_fkey relationship
    // We try to fetch with the relationship
    const { error: relError } = await supabase
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(name)')
        .limit(1);

    if (relError) {
        console.error("Error fetching with relationship:", relError);
        console.log("Try generic profiles reference...");
        const { error: relError2 } = await supabase
            .from('posts')
            .select('*, profiles(name)')
            .limit(1);
        if (relError2) console.error("Error fetching generic profiles:", relError2);
        else console.log("Generic profiles fetch worked!");
    } else {
        console.log("Relationship fetch SUCCESS!");
    }
}

verify();
