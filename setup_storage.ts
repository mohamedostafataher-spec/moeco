import { supabase } from './services/supabaseClient';

async function setup() {
  const { data, error } = await supabase.storage.getBucket('avatars');
  if (error && error.message.includes('not found')) {
    console.log("Bucket not found, attempting to create...");
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });
    console.log("Create Result:", newBucket, createError);
  } else {
    console.log("Bucket already exists or error checking:", data, error);
    if (!data?.public) {
      await supabase.storage.updateBucket('avatars', { public: true });
    }
  }
}
setup();
