import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  tooltip?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = true,
  label,
  tooltip,
  className
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  const variantLabels = {
    success: 'Excelente',
    warning: 'Aceptable',
    danger: 'Requiere atención',
    default: ''
  };

  const content = (
    <div className={cn('w-full cursor-help', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showLabel && <span className="text-sm font-medium">{value}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', variantClasses[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );

  const defaultTooltip = `${label || 'Valor'}: ${value}% de ${max}%${variantLabels[variant] ? ` - ${variantLabels[variant]}` : ''}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[250px] text-sm">
        {tooltip || defaultTooltip}
      </TooltipContent>
    </Tooltip>
  );
}

interface ComparisonBarProps {
  items: Array<{
    label: string;
    value: number;
    color?: 'success' | 'warning' | 'danger' | 'default';
    logo?: string | null;
    tooltip?: string;
  }>;
  max?: number;
  title?: string;
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function ComparisonBar({
  items,
  max,
  title,
  valueFormatter = (v) => `${v}%`,
  className
}: ComparisonBarProps) {
  const maxValue = max || Math.max(...items.map(i => i.value), 1);

  const colorLabels = {
    success: 'Excelente',
    warning: 'Aceptable', 
    danger: 'Requiere atención',
    default: ''
  };

  return (
    <div className={cn('space-y-3', className)}>
      {title && <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>}
      {items.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const colorClass = {
          success: 'bg-green-500',
          warning: 'bg-yellow-500',
          danger: 'bg-red-500',
          default: 'bg-primary'
        }[item.color || 'default'];

        const defaultTooltip = `${item.label}: ${valueFormatter(item.value)}${colorLabels[item.color || 'default'] ? ` - ${colorLabels[item.color || 'default']}` : ''}`;

        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 cursor-help">
                <div className="w-32 flex items-center gap-2 flex-shrink-0">
                  {item.logo && (
                    <img 
                      src={item.logo} 
                      alt={item.label}
                      className="w-6 h-6 object-contain rounded bg-transparent p-0.5 border"
                    />
                  )}
                  <span className="text-sm font-medium truncate">{item.label}</span>
                </div>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500', colorClass)}
                    style={{ width: `${Math.max(percentage, 10)}%` }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {valueFormatter(item.value)}
                    </span>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] text-sm">
              {item.tooltip || defaultTooltip}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
