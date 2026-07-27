import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = '', size = 20 }) => {
  // Map strings to Lucide components
  switch (name.toLowerCase()) {
    case 'utensils':
    case 'food':
    case 'alimentação':
      return <Icons.Utensils className={className} size={size} />;
    case 'car':
    case 'transport':
    case 'transporte':
      return <Icons.Car className={className} size={size} />;
    case 'home':
    case 'housing':
    case 'moradia':
      return <Icons.Home className={className} size={size} />;
    case 'tv':
    case 'entertainment':
    case 'lazer':
      return <Icons.Tv className={className} size={size} />;
    case 'trending-up':
    case 'investments':
    case 'investimentos':
      return <Icons.TrendingUp className={className} size={size} />;
    case 'circle':
    case 'others':
    case 'outros':
      return <Icons.Circle className={className} size={size} />;
    case 'shopping-bag':
    case 'shopping':
    case 'compras':
      return <Icons.ShoppingBag className={className} size={size} />;
    case 'dollar-sign':
    case 'income':
    case 'salário':
    case 'receita':
      return <Icons.DollarSign className={className} size={size} />;
    case 'coffee':
      return <Icons.Coffee className={className} size={size} />;
    case 'activity':
    case 'health':
    case 'saúde':
      return <Icons.Activity className={className} size={size} />;
    case 'gift':
      return <Icons.Gift className={className} size={size} />;
    case 'book':
    case 'education':
    case 'educação':
      return <Icons.BookOpen className={className} size={size} />;
    default:
      return <Icons.Circle className={className} size={size} />;
  }
};
