import React, {useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {HomeScreen} from './src/screens/HomeScreen';
import {SmsDemoScreen} from './src/screens/SmsDemoScreen';

const App = () => {
  const [screen, setScreen] = useState<'home' | 'smsDemo'>('home');

  return (
    <SafeAreaProvider>
      {screen === 'home' ? (
        <HomeScreen onOpenSmsDemo={() => setScreen('smsDemo')} />
      ) : (
        <SmsDemoScreen onBack={() => setScreen('home')} />
      )}
    </SafeAreaProvider>
  );
};

export default App;
