-- Create storage bucket for property media
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-media', 'property-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for uploading property media
CREATE POLICY "Anyone can upload property media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'property-media');

-- Create policy for viewing property media
CREATE POLICY "Anyone can view property media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-media');

-- Create policy for deleting property media
CREATE POLICY "Anyone can delete property media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'property-media');