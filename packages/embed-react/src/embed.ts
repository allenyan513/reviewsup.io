import React from 'react';
import ReactDOMClient from 'react-dom/client';
import { WidgetClient } from './components/widget.client';
//todo if dist is not available, use the source files directly
import '../dist/styles/styles.css';

const mountPoints = document.querySelectorAll('[data-widget-id]');
mountPoints.forEach((mountPoint) => {
  const widgetId = mountPoint.getAttribute('data-widget-id');

  if (widgetId) {
    const reactRoot = ReactDOMClient.createRoot(mountPoint);
    reactRoot.render(
      React.createElement(WidgetClient, {
        widgetId: widgetId,
      }),
    );
  }
});
