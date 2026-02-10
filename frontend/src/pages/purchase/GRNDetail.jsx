import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, Package, Building } from 'lucide-react';
import { grnAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, LoadingScreen } from '../../components/ui';

export default function GRNDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['grn', id],
    queryFn: () => grnAPI.getById(id),
  });
  
  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="text-center py-12 text-red-600">Failed to load GRN</div>;
  
  const grn = data?.data;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/purchase/grn')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{grn?.grn_number}</h1>
              <Badge color={grn?.status === 'verified' ? 'success' : 'warning'}>
                {grn?.status || 'Pending'}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">Received on {formatDate(grn?.received_date)}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Received Items</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Product</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase px-6 py-3">Ordered</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase px-6 py-3">Received</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {grn?.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">{item.ordered_quantity}</td>
                      <td className="px-6 py-4 text-center text-gray-900">{item.received_quantity}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge color={item.received_quantity >= item.ordered_quantity ? 'success' : 'warning'}>
                          {item.received_quantity >= item.ordered_quantity ? 'Complete' : 'Partial'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{grn?.supplier_name}</p>
                  <p className="text-sm text-gray-500">{grn?.supplier_email}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Purchase Order</span>
                  <a href={`/purchase/orders/${grn?.purchase_order_id}`} className="text-primary-600 hover:underline">
                    {grn?.po_number}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Received Date</span>
                  <span className="text-gray-900">{formatDate(grn?.received_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Received By</span>
                  <span className="text-gray-900">{grn?.received_by || 'N/A'}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
