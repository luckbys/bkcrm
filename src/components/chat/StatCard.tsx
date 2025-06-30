import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon }) => (
  <div className="p-4 bg-card rounded-lg border space-y-2">
    <div className="flex items-center gap-2">
      {icon}
      <h4 className="font-medium">{title}</h4>
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
); 