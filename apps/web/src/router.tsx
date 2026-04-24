import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './routes/Dashboard';
import { ProductsPage } from './routes/Products';
import { ProductDetailPage } from './routes/ProductDetail';
import { LabPage } from './routes/Lab';
import { MeasurementsPage } from './routes/Measurements';

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
    ],
  },
]);
