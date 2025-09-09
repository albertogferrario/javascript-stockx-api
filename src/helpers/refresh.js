function createInterceptor(client, options = {}) {
  const {
    onRefresh,
    shouldRefresh = (error) => error.response && error.response.status === 401,
    maxRetries = 1,
  } = options;

  if (!onRefresh || typeof onRefresh !== 'function') {
    throw new Error('onRefresh callback is required');
  }

  let isRefreshing = false;
  let refreshSubscribers = [];

  const onRefreshed = (token) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
  };

  const onRefreshFailed = (error) => {
    refreshSubscribers.forEach((callback) => callback(null, error));
    refreshSubscribers = [];
  };

  const addRefreshSubscriber = (callback) => {
    refreshSubscribers.push(callback);
  };

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (!shouldRefresh(error) || originalRequest._retry >= maxRetries) {
        return Promise.reject(error);
      }

      originalRequest._retry = (originalRequest._retry || 0) + 1;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token, refreshError) => {
            if (refreshError) {
              reject(refreshError);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client.request(originalRequest));
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await onRefresh();
        isRefreshing = false;
        onRefreshed(newToken);
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client.request(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed(refreshError);
        return Promise.reject(refreshError);
      }
    }
  );

  return client;
}

async function refreshToken(refreshToken, clientId, clientSecret, tokenUrl) {
  const axios = require('axios');
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}

module.exports = {
  createInterceptor,
  refreshToken,
};