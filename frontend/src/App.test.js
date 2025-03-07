import React from 'react';
import { render, screen } from '@testing-library/react';
import { App } from './index';

test('renders login heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Login/i);
  expect(headingElement).toBeInTheDocument();
});
