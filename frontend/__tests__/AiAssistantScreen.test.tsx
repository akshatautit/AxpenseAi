/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AiAssistantScreen} from '../src/screens/AiAssistantScreen';

const Stack = createNativeStackNavigator();

const createRenderer = () =>
  ReactTestRenderer.create(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Ai" component={AiAssistantScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );

const textContent = (node: ReactTestRenderer.ReactTestInstance): string => {
  const children = node.children;
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children) && typeof children[0] === 'string') {
    return children[0];
  }
  return '';
};

const findText = (
  root: ReactTestRenderer.ReactTestInstance,
  text: string,
) =>
  root.findAll(
    (node: ReactTestRenderer.ReactTestInstance) =>
      (node.type as unknown as string) === 'Text' &&
      textContent(node).includes(text),
  );

const findInput = (
  root: ReactTestRenderer.ReactTestInstance,
  placeholder: string,
) =>
  root.findAll(
    (node: ReactTestRenderer.ReactTestInstance) =>
      (node.type as unknown as string) === 'TextInput' &&
      node.props.placeholder === placeholder,
  );

test('renders the empty state with header, hero, chips, insights and input', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = createRenderer();
  });
  const root = renderer.root;

  expect(findText(root, 'AI Assistant').length).toBeGreaterThan(0);
  expect(findText(root, 'Your Personal Financial Intelligence').length).toBeGreaterThan(0);
  expect(findText(root, 'Online').length).toBeGreaterThan(0);
  expect(findText(root, 'Good Morning, Akshata').length).toBeGreaterThan(0);
  expect(findText(root, 'analyzed your latest transactions').length).toBeGreaterThan(0);
  expect(findText(root, 'Live Insights').length).toBeGreaterThan(0);
  expect(findText(root, 'Today\u2019s Spending').length).toBeGreaterThan(0);
  expect(findText(root, 'Financial Health').length).toBeGreaterThan(0);
  expect(findText(root, 'Your AI Financial Assistant is Ready').length).toBeGreaterThan(0);
  expect(findText(root, 'Hold to talk to your AI').length).toBeGreaterThan(0);
  expect(findText(root, 'This month spend').length).toBeGreaterThan(0);
  expect(findText(root, 'Subscriptions').length).toBeGreaterThan(0);
  expect(findText(root, 'Voice Mode \u00b7 Hold to talk').length).toBeGreaterThan(0);
  expect(findInput(root, 'Ask anything about your finances...').length).toBeGreaterThan(0);

  await ReactTestRenderer.act(async () => {
    renderer.unmount();
  });
});

test('a quick action chip produces a chat response with smart card, chart and actions', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = createRenderer();
  });
  const root = renderer.root;

  const chipText = root.findAll(
    (node: ReactTestRenderer.ReactTestInstance) =>
      (node.type as unknown as string) === 'Text' &&
      textContent(node).includes('This month spend'),
  )[0];
  expect(chipText).toBeTruthy();

  let chipNode: ReactTestRenderer.ReactTestInstance | null = chipText.parent;
  while (chipNode && typeof chipNode.props?.onPress !== 'function') {
    chipNode = chipNode.parent;
  }
  expect(chipNode).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    chipNode!.props.onPress();
  });

  expect(
    findText(root, 'How much did I spend this month?').length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));
  });

  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
  });

  expect(
    findText(root, 'Here\u2019s a quick snapshot of your finances').length,
  ).toBeGreaterThan(0);
  expect(findText(root, 'Expense Summary').length).toBeGreaterThan(0);
  expect(findText(root, '\u20b918,250').length).toBeGreaterThan(0);
  expect(findText(root, 'View Transactions').length).toBeGreaterThan(0);
  expect(findText(root, 'View Analytics').length).toBeGreaterThan(0);
  expect(findText(root, 'Suggestions').length).toBeGreaterThan(0);

  await ReactTestRenderer.act(async () => {
    renderer.unmount();
  });
});
