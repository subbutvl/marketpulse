import "./global.css"; 
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { TargetCity } from './src/types/tracker';
import { getTrackerData } from './src/services/apiService';
import { MetricCard } from './src/components/MetricCard';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<TargetCity>('Chennai');
  const [globalData, setGlobalData] = useState<any>(null);
  const [localData, setLocalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const citiesList: TargetCity[] = ['Chennai', 'Mumbai', 'Delhi', 'Kolkata', 'Bengaluru'];

  const loadTrackerData = async (city: TargetCity, forceRefresh = false) => {
    setIsLoading(true);
    try {
      const { global, local } = await getTrackerData(city, forceRefresh);
      setGlobalData(global);
      setLocalData(local);
    } catch (error) {
      console.error("Layout linkage failure:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrackerData(selectedCity, false); 
  }, [selectedCity]);

  const handleCitySelect = (city: TargetCity) => {
    setSelectedCity(city);
    setIsDrawerOpen(false);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0E0F' }}>
        <StatusBar style="light" />
        
        {/* Header Layout Banner */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 }}>
              Market<Text style={{ color: '#00E699' }}>Pulse</Text>
            </Text>
            {globalData && (
              <Text style={{ fontSize: 11, color: '#5C5B5C', marginTop: 3, fontWeight: '700', letterSpacing: 0.2 }}>
                FEED TIME • {globalData.lastUpdated}
              </Text>
            )}
          </View>

          <TouchableOpacity 
            onPress={() => setIsDrawerOpen(true)}
            activeOpacity={0.8}
            style={{ backgroundColor: '#0f0f0f1a', paddingHorizontal: 14, height: 42, borderRadius: 4, borderWidth: 0.5, borderColor: '#1111111a', flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{selectedCity}</Text>
            <Feather name="chevron-down" size={14} color="#00E699" />
          </TouchableOpacity>
        </View>

        {/* Dashboard Grid Feed */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#00E699" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
            
            {/* GROUP 1: Currency Matrix */}
            <View>
              <Text style={{ color: '#5C5B5C', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 0 }}>
                Currencies
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                <MetricCard label="US Dollar" value={globalData?.usdToInr || 0} accentColor="#00E699" />
                <MetricCard label="Euro" value={globalData?.eurToInr || 0} accentColor="#00E699" />
              </View>
            </View>

            {/* GROUP 2: Stock Indexes */}
            <View>
              <Text style={{ color: '#5C5B5C', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 0 }}>
                Stock Indexes
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                <MetricCard label="BSE Sensex" value={globalData?.bseSensex || 0} accentColor="#C34CFF" isPoints={true} />
                <MetricCard label="NSE Nifty" value={globalData?.nseNifty || 0} accentColor="#C34CFF" isPoints={true} />
              </View>
            </View>

            {/* GROUP 3: Fuel & Energy */}
            <View>
              {/* Superscript 2 placed right behind the dynamic active city name */}
              <Text style={{ color: '#5C5B5C', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 0 }}>
                Fuel & Energy ({selectedCity})<Text style={{ color: '#00E699', fontSize: 12 }}>²</Text>
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 1, columnGap: 16  }}>
                <MetricCard label="Petrol Price" value={localData?.petrol || 0} unit="/L" accentColor="#00AAFF" />
                <MetricCard label="Diesel Price" value={localData?.diesel || 0} unit="/L" accentColor="#00AAFF" />
                <MetricCard label="LPG Cylinder" value={localData?.lpg || 0} unit=" Cyl" accentColor="#FF7E44" />
                <MetricCard label="Crude Oil" value={localData?.crudeOil || 0} unit="/bbl" accentColor="#FF7E44" />
              </View>
            </View>

            {/* GROUP 4: Precious Metals */}
            <View>
              {/* Superscript 1 placed right behind Precious Metals text node */}
              <Text style={{ color: '#5C5B5C', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 0 }}>
                Precious Metals<Text style={{ color: '#00E699', fontSize: 12 }}>¹</Text> ({selectedCity})<Text style={{ color: '#00E699', fontSize: 12 }}>²</Text>
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                <MetricCard label="Gold 24K" value={localData?.gold24k || 0} unit="/1g" accentColor="#FFD333" />
                <MetricCard label="Gold 22K" value={localData?.gold22k || 0} unit="/1g" accentColor="#FFD333" />
                <MetricCard label="Silver Rate" value={localData?.silver || 0} unit="/kg" accentColor="#cbd5e1" />
              </View>
            </View>

            {/* GROUP 5: Luxury & Strategic Assets */}
            <View>
              <Text style={{ color: '#5C5B5C', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 0 }}>
                Luxury & Strategic Assets
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                <MetricCard label="Diamond" value={localData?.diamond || 0} unit="/ct" accentColor="#00AAFF" />
                <MetricCard label="Platinum" value={localData?.platinum || 0} unit="/1g" accentColor="#E62EE6" />
              </View>
            </View>

            {/* Sync Action Trigger */}
            <TouchableOpacity 
              onPress={() => loadTrackerData(selectedCity, true)}
              activeOpacity={0.85}
              style={{ backgroundColor: '#111111', paddingVertical: 16, borderRadius: 4, alignItems: 'center', marginTop: 8, borderWidth: 0.5, borderColor: '#2A2929' }}
            >
              <Text style={{ color: '#00E699', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 }}>FORCE DATA SYNC</Text>
            </TouchableOpacity>

            {/* Dual Market Footnotes Segment */}
            <View style={{ marginTop: 4, paddingHorizontal: 4, marginBottom: 30, gap: 8 }}>
              <Text style={{ color: '#3A3A3A', fontSize: 11, lineHeight: 16, fontWeight: '500', textAlign: 'justify' }}>
                <Text style={{ color: '#00E699', fontWeight: '700' }}>¹ </Text>Precious metal valuations are derived dynamically from international spot indicators and automatically adjusted using an Indian Market Factor multiplier. This math accounts for national basic customs import duty, AIDC levies, and the standard 3% retail GST pipeline needed to reflect physical domestic market counter prices in India accurately.
              </Text>
              
              <Text style={{ color: '#3A3A3A', fontSize: 11, lineHeight: 16, fontWeight: '500', textAlign: 'justify' }}>
                <Text style={{ color: '#00E699', fontWeight: '700' }}>² </Text>Values displayed under this section serve as high-fidelity approximations calculated for retail informational tracking purposes. Final over-the-counter transaction metrics can vary slightly based on localized bullion dealer premiums and specific jeweler making charges across state regions.
              </Text>
            </View>

          </ScrollView>
        )}

        {/* BOTTOM DRAWER MODAL OVERLAY */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isDrawerOpen}
          onRequestClose={() => setIsDrawerOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsDrawerOpen(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
              <TouchableWithoutFeedback>
                <View style={{ backgroundColor: '#111111', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, borderWidth: 0.5, borderColor: '#2A2929', minHeight: 360 }}>
                  <View style={{ width: 40, height: 4, backgroundColor: '#2A2929', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
                  <Text style={{ color: '#8E8D8D', fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Select Region Market Pivot</Text>
                  <ScrollView>
                    {citiesList.map((city) => {
                      const isCurrent = city === selectedCity;
                      return (
                        <TouchableOpacity
                          key={city}
                          onPress={() => handleCitySelect(city)}
                          style={{ paddingVertical: 16, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isCurrent ? '#1F1E1E1a' : 'transparent', borderRadius: 4, marginBottom: 4 }}
                        >
                          <Text style={{ color: isCurrent ? '#00E699' : '#FFFFFF', fontSize: 16, fontWeight: isCurrent ? '700' : '400' }}>{city}</Text>
                          {isCurrent && <Feather name="check" size={16} color="#00E699" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}