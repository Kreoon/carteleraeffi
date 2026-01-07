-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for storing country banners and carrier logos
CREATE TABLE public.benchmark_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_type TEXT NOT NULL,
  config_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(config_type, config_key)
);

-- Enable RLS but allow public access since this is configuration data
ALTER TABLE public.benchmark_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read configuration
CREATE POLICY "Anyone can read benchmark config" 
ON public.benchmark_config 
FOR SELECT 
USING (true);

-- Allow anyone to insert config
CREATE POLICY "Anyone can insert benchmark config" 
ON public.benchmark_config 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update config
CREATE POLICY "Anyone can update benchmark config" 
ON public.benchmark_config 
FOR UPDATE 
USING (true);

-- Allow anyone to delete config
CREATE POLICY "Anyone can delete benchmark config" 
ON public.benchmark_config 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_benchmark_config_updated_at
BEFORE UPDATE ON public.benchmark_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();