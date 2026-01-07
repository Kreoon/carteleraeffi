-- Create table for saved reports
CREATE TABLE public.saved_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(country, year, month)
);

-- Enable Row Level Security
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Anyone can read saved reports" 
ON public.saved_reports 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert saved reports" 
ON public.saved_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update saved reports" 
ON public.saved_reports 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete saved reports" 
ON public.saved_reports 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_reports_updated_at
BEFORE UPDATE ON public.saved_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();