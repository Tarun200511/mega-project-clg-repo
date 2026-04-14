import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ForensiXBot from './ForensiXBot';

export default function Layout() {
  const params = useParams();
  const [botOpen, setBotOpen] = useState(false);
  const [botExternalOpen, setBotExternalOpen] = useState(false);

  const openBot = () => setBotExternalOpen(true);

  return (
    <div className="flex h-screen bg-bg-deep text-white overflow-hidden grid-bg">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[400px] h-[400px] bg-violet/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />

      <Sidebar onOpenBot={openBot} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onOpenBot={openBot} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet context={{ openBot }} />
        </main>
      </div>

      {/* Persistent AI Bot (floats over all pages) */}
      <ForensiXBot
        externalOpen={botExternalOpen}
        onExternalOpenConsumed={() => setBotExternalOpen(false)}
      />
    </div>
  );
}
