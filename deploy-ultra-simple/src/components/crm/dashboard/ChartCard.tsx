import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  type?: 'bar' | 'line' | 'pie';
  showTrend?: boolean;
  trendValue?: number;
  trendDirection?: 'up' | 'down';
}

export const ChartCard = ({ 
  title, 
  data, 
  type = 'bar', 
  showTrend = false, 
  trendValue, 
  trendDirection = 'up' 
}: ChartCardProps) => {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            {title}
          </CardTitle>
          {showTrend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trendDirection === 'up' ? "text-green-600" : "text-red-600"
            )}>
              {trendDirection === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {trendValue}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {type === 'bar' && (
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-600">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={cn("h-3 rounded-full transition-all duration-500", item.color)}
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'pie' && (
            <div className="space-y-3">
              <div className="relative w-32 h-32 mx-auto">
                {/* Simulação de gráfico de pizza usando CSS */}
                <div className="w-32 h-32 rounded-full border-8 border-gray-200 relative overflow-hidden">
                  {data.map((item, index) => {
                    const percentage = (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100;
                    return (
                      <div
                        key={index}
                        className={cn(
                          "absolute inset-0 rounded-full",
                          item.color.replace('bg-', 'border-l-')
                        )}
                        style={{
                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + percentage * 0.5}% 0%)`,
                          transform: `rotate(${index * 90}deg)`
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", item.color)} />
                      <span className="font-medium text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-gray-600">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'line' && (
            <div className="space-y-3">
              <div className="h-32 relative">
                <svg className="w-full h-full" viewBox="0 0 300 100">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-blue-600"
                    points={data.map((item, index) => 
                      `${(index / (data.length - 1)) * 280 + 10},${90 - (item.value / maxValue) * 70}`
                    ).join(' ')}
                  />
                  {data.map((item, index) => (
                    <circle
                      key={index}
                      cx={(index / (data.length - 1)) * 280 + 10}
                      cy={90 - (item.value / maxValue) * 70}
                      r="3"
                      className="text-blue-600 fill-current"
                    />
                  ))}
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                {data.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="font-medium">{item.value.toLocaleString()}</div>
                    <div>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 