import React from 'react';
import { PricingPage } from './PricingPage';

export const ProPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return <PricingPage onNavigate={onNavigate} routePath="/pro" />;
};
