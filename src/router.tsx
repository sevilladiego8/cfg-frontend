import { Route, Routes } from 'react-router-dom';

import AppLayout from '@/layouts/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Lands from '@/pages/Lands';
import Products from '@/pages/Products';
import Suppliers from '@/pages/Suppliers';
import Tickets from '@/pages/Tickets';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="lands" element={<Lands />} />
        <Route path="products" element={<Products />} />
        <Route path="tickets" element={<Tickets />} />
      </Route>
    </Routes>
  );
}
