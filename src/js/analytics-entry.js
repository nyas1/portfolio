import { inject } from '@vercel/analytics';

if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  inject({
    scriptSrc: 'https://va.vercel-scripts.com/v1/script.js',
  });
}
