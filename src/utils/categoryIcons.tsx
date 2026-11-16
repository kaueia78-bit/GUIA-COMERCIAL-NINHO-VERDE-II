import React from 'react';
import {
  Utensils,
  Cake,
  Pizza,
  Coffee,
  Home,
  Waves,
  Trees,
  Car,
  Hammer,
  Wrench,
  Sparkles,
  Dog,
  Store,
  Briefcase,
  Scissors,
  ShoppingBag,
  Heart,
  Truck,
  Shield,
  Dumbbell,
  Navigation,
  Package,
  LucideProps,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Utensils,
  Cake,
  Pizza,
  Coffee,
  Home,
  Waves,
  Trees,
  Car,
  Hammer,
  Wrench,
  Sparkles,
  Dog,
  Store,
  Briefcase,
  Scissors,
  ShoppingBag,
  Heart,
  Truck,
  Shield,
  Dumbbell,
  Navigation,
  Package,
};

export function getCategoryIcon(name: string, props: LucideProps = { className: 'w-5 h-5' }) {
  const IconComponent = iconMap[name] || Store;
  return <IconComponent {...props} />;
}
