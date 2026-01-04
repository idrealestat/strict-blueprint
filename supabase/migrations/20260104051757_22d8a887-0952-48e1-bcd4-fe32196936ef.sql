-- Fix property-media storage policies to check ownership
-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

-- Create proper ownership-based UPDATE policy
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create proper ownership-based DELETE policy
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);