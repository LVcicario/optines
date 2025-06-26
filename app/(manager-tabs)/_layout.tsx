import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { ArrowLeft, LogOut } from 'lucide-react-native';

export default function ManagerTabLayout() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isMainPage, setIsMainPage] = useState(true);

  useEffect(() => {
    // Debug: log the current pathname
    console.log('Current pathname:', pathname);
    
    // Check if we're on the main page
    const isOnMainPage = pathname === '/(manager-tabs)' || 
                        pathname === '/(manager-tabs)/' ||
                        pathname.includes('/(manager-tabs)/index');
    
    setIsMainPage(isOnMainPage);
    setIsVisible(true); // Always show the button now
  }, [pathname]);

  const handleButtonPress = () => {
    if (isMainPage) {
      // Logout - go back to login selection
      router.replace('/');
    } else {
      // Go back to main page
      router.push('/(manager-tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="calculator" />
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="team" />
        <Tabs.Screen name="efficiency" />
      </Tabs>
      
      {/* Bottom Right Navigation Button */}
      {isVisible && (
        <TouchableOpacity 
          style={[
            styles.bottomButton,
            isMainPage ? styles.logoutButton : styles.backButton
          ]}
          onPress={handleButtonPress}
        >
          {isMainPage ? (
            <LogOut color="#ffffff" size={24} strokeWidth={2} />
          ) : (
            <ArrowLeft color="#ffffff" size={24} strokeWidth={2} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  bottomButton: {
    position: 'absolute',
    bottom: 30,
    right: 30, // Moved to bottom right
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    backgroundColor: '#3b82f6',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
});