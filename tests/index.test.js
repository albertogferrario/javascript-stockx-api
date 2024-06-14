const mockAxios = require('jest-mock-axios');
const { StockxApi } = require('../index');

jest.mock('axios');
const stockxApi = new StockxApi('lIit1vWTVz9HY7e0dSbN87JFx0HlUDst3zpOCvMt', '');

test('dev', () => {
  stockxApi.catalog.getAllProductVariants('')
});

// describe('Catalog', () => {
//   afterEach(() => {
//     mockAxios.reset();
//   });
//
//   test('Get all product variants', async () => {
//
//
//     const responseData = { data: 'mocked data' };
//
//     mockAxios.get.mockResolvedValue({ data: responseData });
//
//     const result = await fetchData(endpoint);
//
//     expect(mockAxios.get).toHaveBeenCalledWith(endpoint);
//     expect(result).toEqual(responseData);
//   });
//
//   test('should throw an error when fetch fails', async () => {
//     const endpoint = 'https://api.example.com/data';
//
//     mockAxios.get.mockRejectedValue(new Error('Error fetching data'));
//
//     await expect(fetchData(endpoint)).rejects.toThrow('Error fetching data');
//   });
// });
