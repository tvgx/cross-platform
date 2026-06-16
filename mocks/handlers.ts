import { http, HttpResponse } from 'msw';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com/v1';

export const handlers = [
  http.post(`${BASE_URL}/api/get_list_products`, () => {
    return HttpResponse.json({
      code: '1000',
      message: 'OK.',
      data: [
        {
          id: '1',
          name: 'Sản phẩm Test 1',
          price: '10000',
          is_stock: true,
        },
      ],
      success: true,
    });
  }),

  http.post(`${BASE_URL}/order/get_list_orders`, () => {
    return HttpResponse.json({
      code: '1000',
      message: 'OK.',
      data: [
        {
          id: '101',
          status: 'pending',
          total: '50000',
        },
      ],
      success: true,
    });
  }),
];
