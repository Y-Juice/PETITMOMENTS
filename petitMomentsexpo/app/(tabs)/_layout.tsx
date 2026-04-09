import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FontFamily } from '@/constants/typography';

const ACCENT = '#E54D3D';
const TAB_BAR_BG = '#FDF8E8';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: 'rgba(229, 77, 61, 0.45)',
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: 'rgba(0,0,0,0.06)',
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.body,
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Kaart',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Nieuw',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus" color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Bibliotheek',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="folder.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profiel',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.crop.circle" color={color} />,
        }}
      />
    </Tabs>
  );
}
