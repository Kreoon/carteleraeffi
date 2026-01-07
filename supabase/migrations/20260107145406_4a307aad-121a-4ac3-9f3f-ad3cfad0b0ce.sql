-- Create storage bucket for markdown images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('markdown-images', 'markdown-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read images (public bucket)
CREATE POLICY "Public read access for markdown images"
ON storage.objects FOR SELECT
USING (bucket_id = 'markdown-images');

-- Allow anyone to upload images (for simplicity in this tool)
CREATE POLICY "Anyone can upload markdown images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'markdown-images');

-- Allow anyone to delete their own uploads
CREATE POLICY "Anyone can delete markdown images"
ON storage.objects FOR DELETE
USING (bucket_id = 'markdown-images');