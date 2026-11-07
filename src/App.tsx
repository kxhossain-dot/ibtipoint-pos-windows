/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { ReceiptModal } from './components/Common/ReceiptModal';
import { PinModal } from './components/Auth/PinModal';
import { SaleOrder } from './types';

// Screens are loaded on demand so the first start is fast and the bundle stays small
const DashboardView = lazy(() => import('./components/Dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const POSView = lazy(() => import('./components/POS/POSView').then(m => ({ default: m.POSView })));
const InventoryView = lazy(() => import('./components/Inventory/InventoryView').then(m => ({ default: m.InventoryView })));
const CustomerKhataView = lazy(() => import('./components/Khata/CustomerKhataView').then(m => ({ default: m.CustomerKhataView })));
const MobileBankingView = lazy(() => import('./components/MobileBanking/MobileBankingView').then(m => ({ default: m.MobileBankingView })));
const PhotoStudioView = lazy(() => import('./components/PhotoStudio/PhotoStudioView').then(m => ({ default: m.PhotoStudioView })));
const ExpenseView = lazy(() => import('./components/Expense/ExpenseView').then(m => ({ default: m.ExpenseView })));
const ReportsView = lazy(() => import('./components/Reports/ReportsView').then(m => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./components/Settings/SettingsView').then(m => ({ default: m.SettingsView })));

function AppContent() {
  const { activeTab, setActiveTab, orders, latestOrder, currentRole } = useApp();

  // Receipt Modal state
  const [receiptOrder, setReceiptOrder] = useState<SaleOrder | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Pin Modal state
  const [targetPinRole, setTargetPinRole] = useState<'admin' | 'staff'>('admin');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // F2 keyboard shortcut to quickly jump to POS sale terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  // Staff must not stay on admin-only screens after locking (reports, settings)
  useEffect(() => {
    if (currentRole !== 'admin' && (activeTab === 'reports' || activeTab === 'settings')) {
      setActiveTab('dashboard');
    }
  }, [currentRole, activeTab, setActiveTab]);

  const handleOpenReceipt = (orderId: string) => {
    const found = orders.find(o => o.id === orderId) || latestOrder;
    if (found) {
      setReceiptOrder(found);
      setIsReceiptOpen(true);
    }
  };

  const handleOpenPinModal = (role: 'admin' | 'staff') => {
    setTargetPinRole(role);
    setIsPinModalOpen(true);
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* Top Universal Navbar */}
      <Navbar onOpenPinModal={handleOpenPinModal} />

      {/* Main Layout Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* Desktop Windows Sidebar */}
        <Sidebar />

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 min-w-0 overflow-y-auto overscroll-contain p-3 sm:p-5 lg:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<div className="p-10 text-center text-sm text-slate-400">…</div>}>
            {activeTab === 'dashboard' && (
              <DashboardView 
                onOpenReceipt={handleOpenReceipt} 
                onOpenPinModal={handleOpenPinModal} 
              />
            )}
            {activeTab === 'pos' && (
              <POSView onOpenReceipt={handleOpenReceipt} />
            )}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'khata' && <CustomerKhataView />}
            {activeTab === 'mobile_banking' && <MobileBankingView />}
            {activeTab === 'photo_studio' && <PhotoStudioView />}
            {activeTab === 'expense' && <ExpenseView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'settings' && <SettingsView />}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile Android Bottom Sticky Bar */}
      <MobileNav />

      {/* Printable Thermal Receipt Modal */}
      <ReceiptModal
        order={receiptOrder}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* PIN Authentication & Role Switcher Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        targetRole={targetPinRole}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
