import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from './index';

test('renders app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/I Told You So/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders get started heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Get Started/i);
  expect(headingElement).toBeInTheDocument();
});
