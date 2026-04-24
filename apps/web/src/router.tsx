import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './routes/Dashboard';
import { ProductsPage } from './routes/Products';
import { ProductDetailPage } from './routes/ProductDetail';
import { LabPage } from './routes/Lab';
import { MeasurementsPage } from './routes/Measurements';
import { AdminLayout } from './routes/Admin';
import { AdminLabels } from './routes/admin/AdminLabels';
import { AdminForms } from './routes/admin/AdminForms';
import { AdminSpc } from './routes/admin/AdminSpc';
import { AdminAqdef } from './routes/admin/AdminAqdef';
import { AdminRaw } from './routes/admin/AdminRaw';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'lab', element: <LabPage /> },
      { path: 'measurements', element: <MeasurementsPage /> },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminLabels /> },
          { path: 'forms', element: <AdminForms /> },
          { path: 'spc', element: <AdminSpc /> },
          { path: 'aqdef', element: <AdminAqdef /> },
          { path: 'raw', element: <AdminRaw /> },
        ],
      },
    ],
  },
]);
