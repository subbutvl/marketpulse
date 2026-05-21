import React from 'react';
import { Text, View, Dimensions } from 'react-native';
// Injecting the Feather icon bundle from Expo's core library
import { Feather } from '@expo/vector-icons';

interface MetricCardProps {
  label: string;
  value: number;
  subValue?: string;
  unit?: string;
  accentColor?: string;
  isPoints?: boolean;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const BASELINE_MARKET_CLOSES: Record<string, number> = {
  "US Dollar": 83.45,
  "Euro": 90.10,
  "BSE Sensex": 74100.00,
  "NSE Nifty": 22480.00,
  "Petrol Price": 100.00,
  "Diesel Price": 90.00,
  "LPG Cylinder": 810.00,
  "Crude Oil": 6500,
  "Gold 24K": 7300,
  "Gold 22K": 6690,
  "Silver Rate": 900.00,
  "Diamond": 65000,
  "Platinum": 2900,
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  unit,
  accentColor = '#FFFFFF',
  isPoints = false,
}) => {
  const referenceValue = BASELINE_MARKET_CLOSES[label] || value;
  const isUp = value >= referenceValue;

  // Applying your exact updated visibility color palette rules
  const directionColor = isUp ? '#00FF00' : '#FF0000';
  // Selecting clean 'arrow-up-right' or 'arrow-down-right' Feather profiles
  const iconName = isUp ? 'arrow-up-right' : 'arrow-down-right';

  return (
    <View
      style={{
        backgroundColor: '#0f0f0f1a', 
        padding: 16,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: '#1111111a',
        width: cardWidth,
        minHeight: 100,
        justifyContent: 'space-between',
      }}
    >
      {/* Upper Label Matrix Block */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#8E8D8D', fontSize: 10, fontWeight: '500', letterSpacing: 0.6, textTransform: 'uppercase', maxWidth: '80%' }}>
          {label}
        </Text>
        
        {/* Modern high-contrast vector icon indicator */}
        <Feather name={iconName} size={14} color={directionColor} />
      </View>

      {/* Main Quantitative Number Layer */}
      <View style={{ marginTop: 0 }}>
        <Text style={{ fontSize: 30, fontWeight: '300', color: accentColor, letterSpacing: -0.5 }}>
          {isPoints ? '' : '₹'}{value.toLocaleString('en-IN')}
          {unit && <Text style={{ fontSize: 13, color: '#5C5B5C', fontWeight: '500' }}> {unit}</Text>}
        </Text>
        
        {/* Sub-context row */}
        {subValue && (
          <Text style={{ color: '#5C5B5C', fontSize: 12, marginTop: 4, fontWeight: '600' }}>
            {subValue}
          </Text>
        )}
      </View>
    </View>
  );
};