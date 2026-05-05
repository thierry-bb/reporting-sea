'use client';

import { useEffect } from 'react';

export default function TabsSync({ tabs }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tabs:update', { detail: tabs }));
  }, [tabs]);
  return null;
}
