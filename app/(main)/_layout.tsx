import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Sidebar } from '../../components/navigation/Sidebar';

export default function MainDrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => (
          <Sidebar 
            activeItem={props.state.routeNames[props.state.index]}
            onMenuSelect={(key) => {
              if (key === 'home') {
                props.navigation.navigate('(tabs)');
              } else {
                // handle other menus if needed
                console.log('Menu selected:', key);
              }
            }}
          />
        )}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: 'Home Tabs',
          }}
        />
        <Drawer.Screen
          name="detail"
          options={{
            drawerLabel: 'Product Detail',
          }}
        />
        <Drawer.Screen
          name="officer"
          options={{
            drawerLabel: 'Officer Dashboard',
            drawerItemStyle: { display: 'none' }, // hide from drawer menu
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
