import React from 'react';
import HRDashboardScreen from '../../hr/HRDashboardScreen';

interface HRDashboardViewProps {
  navigation: any;
}

export default function HRDashboardView({ navigation }: HRDashboardViewProps) {
  return <HRDashboardScreen navigation={navigation} />;
}
