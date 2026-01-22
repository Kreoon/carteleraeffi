import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IndicatorItem {
  label: string;
  value: number;
  color: 'success' | 'warning' | 'danger' | 'default';
  logo?: string | null;
}

interface IndicatorListProps {
  items: IndicatorItem[];
  valueFormatter?: (value: number) => string;
  idealLabel?: string;
  className?: string;
}

export function IndicatorList({
  items,
  valueFormatter = (v) => `${v}%`,
  idealLabel,
  className
}: IndicatorListProps) {
  const colorLabels = {
    success: 'Excelente',
    warning: 'Aceptable', 
    danger: 'Requiere atención',
    default: ''
  };

  const getBadgeClasses = (color: IndicatorItem['color']) => {
    switch (color) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'danger':
        return 'bg-red-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, index) => {
        const defaultTooltip = `${item.label}: ${valueFormatter(item.value)}${colorLabels[item.color] ? ` - ${colorLabels[item.color]}` : ''}`;

        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 cursor-help hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors">
                <div className="w-28 flex items-center gap-2 flex-shrink-0">
                  {item.logo && (
                    <img 
                      src={item.logo} 
                      alt={item.label}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <span className="text-sm font-medium truncate">{item.label}</span>
                </div>
                <div className="flex-1 flex items-center">
                  <span 
                    className={cn(
                      'inline-flex items-center justify-center min-w-[60px] px-3 py-1 rounded-full text-sm font-bold',
                      getBadgeClasses(item.color)
                    )}
                  >
                    {valueFormatter(item.value)}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] text-sm">
              {defaultTooltip}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}