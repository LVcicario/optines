import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { ArrowLeft, LogOut } from 'lucide-react-native';

export default function ManagerTabLayout() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isMainPage, setIsMainPage] = useState(true);

  useEffect(() => {
    // Debug: log the current pathname
    console.log('Current pathname:', pathname);
    
    // Check if we're on the main page - also check for root path when in manager tabs
    const isOnMainPage = pathname === '/(manager-tabs)' || 
                        pathname === '/(manager-tabs)/' ||
                        pathname.includes('/(manager-tabs)/index') ||
                        pathname === '/' ||
                        pathname === '';
    
    console.log('Is main page:', isOnMainPage);
    setIsMainPage(isOnMainPage);
    setIsVisible(true); // Always show the button now
  }, [pathname]);

  const handleButtonPress = () => {
    console.log('Button pressed!');
    console.log('isMainPage:', isMainPage);
    console.log('Current pathname:', pathname);
    
    if (isMainPage) {
      console.log('Attempting to logout - navigating to login page');
      // Logout - go back to login selection with slide left animation
      router.replace({
        pathname: '/login',
        params: {
          animation: 'slide_from_left',
          userType: 'manager'
        }
      });
    } else {
      console.log('Attempting to go back to main page');
      // Go back to main page
      router.push('/(manager-tabs)');
    }
  };

  // Styles inline pour éviter les warnings
  const getButtonStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      bottom: 30,
      right: 30,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      zIndex: 1000,
    };

    if (Platform.OS === 'web') {
      return {
        ...baseStyle,
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
        backgroundColor: isMainPage ? '#ef4444' : '#3b82f6',
      };
    } else {
      return {
        ...baseStyle,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        backgroundColor: isMainPage ? '#ef4444' : '#3b82f6',
      };
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
          style={getButtonStyle()}
          onPress={handleButtonPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isMainPage ? (
            <LogOut color="#ffffff" size={24} strokeWidth={2} />
          ) : (
            <ArrowLeft color="#ffffff" size={24} strokeWidth={2} />
          )}
        </TouchableOpacity>
      )}
      
      {/* Debug info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>Path: {pathname}</Text>
        <Text style={styles.debugText}>Is Main: {isMainPage ? 'Yes' : 'No'}</Text>
        <Text style={styles.debugText}>Visible: {isVisible ? 'Yes' : 'No'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  debugInfo: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1001,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
});